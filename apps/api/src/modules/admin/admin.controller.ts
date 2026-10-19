import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { Role } from '@prisma/client';
import { CancellationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateFeaturedOrderDto } from './dto/update-featured-order.dto';
import { UpdateHomeHeroDto } from './dto/update-home-hero.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateUserRoleDto } from './dto/update-user.dto';
import { ReorderProductImagesDto } from './dto/reorder-product-images.dto';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CancellationService } from '../cancellation/cancellation.service';
import { StorageService } from '../storage/storage.service';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const PRODUCT_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const PRODUCT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function productImageFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = extname(file.originalname).toLowerCase();
  if (!PRODUCT_IMAGE_EXTENSIONS.includes(ext) || !PRODUCT_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    callback(new BadRequestException('Formato no permitido: usá JPG, PNG o WebP'), false);
    return;
  }
  callback(null, true);
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly cancellationService: CancellationService,
    private readonly storage: StorageService,
  ) {}

  @Post('products/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
          callback(new BadRequestException('Formato de imagen no permitido'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Enviá un archivo de imagen');
    const url = await this.storage.uploadImage(file.buffer, file.originalname, file.mimetype);
    return { url };
  }

  @Post('products/:id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
      fileFilter: productImageFileFilter,
    }),
  )
  addProductImage(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminService.addProductImage(request.userId, id, file);
  }

  @Delete('products/:id/images/:imageId')
  deleteProductImage(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.adminService.deleteProductImage(request.userId, id, imageId);
  }

  @Put('products/:id/images/order')
  reorderProductImages(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReorderProductImagesDto,
  ) {
    return this.adminService.reorderProductImages(request.userId, id, body.imageIds);
  }

  @Get('products')
  listProducts() { return this.adminService.listProducts(); }

  @Post('products')
  createProduct(@Req() request: AuthenticatedRequest, @Body() body: CreateProductDto) {
    return this.adminService.createProduct(request.userId, body);
  }

  @Patch('products/:id')
  updateProduct(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.adminService.updateProduct(request.userId, id, body);
  }

  @Delete('products/:id')
  deactivateProduct(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deactivateProduct(request.userId, id);
  }

  @Put('products/featured-order')
  reorderFeaturedProducts(@Req() request: AuthenticatedRequest, @Body() body: UpdateFeaturedOrderDto) {
    return this.adminService.reorderFeaturedProducts(request.userId, body.ids);
  }

  @Get('home/hero')
  getHomeHero() {
    return this.adminService.getHomeHero();
  }

  @Put('home/hero')
  updateHomeHero(@Req() request: AuthenticatedRequest, @Body() body: UpdateHomeHeroDto) {
    return this.adminService.updateHomeHero(request.userId, body);
  }

  @Get('orders')
  listOrders(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.listOrders(
      page === undefined ? undefined : Number(page),
      limit === undefined ? undefined : Number(limit),
    );
  }

  @Patch('orders/:id')
  updateOrder(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.adminService.updateOrder(request.userId, id, body);
  }

  @Get('users')
  listUsers() { return this.adminService.listUsers(); }

  @Patch('users/:id')
  updateUser(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    return this.adminService.updateUser(request.userId, id, body);
  }

  @Get('reviews/pending')
  pendingReviews() { return this.adminService.listPendingReviews(); }

  @Patch('reviews/:id/approve')
  approveReview(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.approveReview(request.userId, id);
  }

  @Delete('reviews/:id')
  deleteReview(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deleteReview(request.userId, id);
  }

  @Get('audit')
  listAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.listAuditLogs(
      page === undefined ? undefined : Number(page),
      limit === undefined ? undefined : Number(limit),
    );
  }

  @Get('cancellations')
  listCancellations(@Query('status') status?: CancellationStatus) {
    return this.cancellationService.list({ status });
  }

  @Patch('cancellations/:id')
  setCancellationStatus(@Param('id') id: string, @Query('status') status: CancellationStatus) {
    return this.cancellationService.setStatus(id, status);
  }
}
