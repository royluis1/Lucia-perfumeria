import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('products')
  listProducts() { return this.adminService.listProducts(); }

  @Post('products')
  createProduct(@Body() body: CreateProductDto) { return this.adminService.createProduct(body); }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.adminService.updateProduct(id, body);
  }

  @Delete('products/:id')
  deactivateProduct(@Param('id') id: string) { return this.adminService.deactivateProduct(id); }

  @Get('reviews/pending')
  pendingReviews() { return this.adminService.listPendingReviews(); }

  @Patch('reviews/:id/approve')
  approveReview(@Param('id') id: string) { return this.adminService.approveReview(id); }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) { return this.adminService.deleteReview(id); }
}
