import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateUserRoleDto } from './dto/update-user.dto';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('products/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const dir = join(process.cwd(), process.env.UPLOADS_DIR?.trim() || 'public', 'products');
          mkdirSync(dir, { recursive: true });
          callback(null, dir);
        },
        filename: (_req, file, callback) => {
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `${randomBytes(16).toString('hex')}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
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
  uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Enviá un archivo de imagen');
    const prefix = process.env.UPLOADS_PREFIX?.trim() || '/uploads';
    return { url: `${prefix}/products/${file.filename}` };
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
}
