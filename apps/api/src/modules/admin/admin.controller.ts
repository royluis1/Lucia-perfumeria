import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
