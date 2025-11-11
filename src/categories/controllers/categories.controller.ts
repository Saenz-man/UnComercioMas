import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Delete, 
  Param, 
  UseGuards, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiResponse, 
  ApiBody 
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../users/entities/user.entity';
import { Roles } from '../../auth/Decorators/roles.decorator';
import { RolesGuard } from '../../auth/Guards/roles.guard';
import { CategoriesService } from '../service/categories.service';
import { CreateCategoryDto } from '../DTO/create-category';

@ApiTags('Catálogo / Categorías')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ----------------------------------------------------
  // S2.2: ENDPOINT PÚBLICO - OBTENER TODAS
  // ----------------------------------------------------
  // Este endpoint es público (no lleva @UseGuards ni @ApiBearerAuth)
  // Llama al método findAll() que ya tenías en tu servicio.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PÚBLICO: Obtiene todas las categorías' })
  @ApiResponse({ status: 200, description: 'Lista de todas las categorías.' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  // ----------------------------------------------------
  // S2.2: ENDPOINT PÚBLICO - OBTENER UNA POR ID
  // ----------------------------------------------------
  // Es buena práctica exponer también el "findOne" públicamente.
  // Tampoco lleva guards de seguridad.
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PÚBLICO: Obtiene una categoría por su ID' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  async findOne(@Param('id') id: string) {
    // Llama al método findOne() que ya tenías en tu servicio.
    return this.categoriesService.findOne(id);
  }

  // ----------------------------------------------------
  // S2.1: ENDPOINT PROTEGIDO (ADMIN) - CREAR
  // ----------------------------------------------------
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN) 
  @ApiBearerAuth() 
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ADMIN: Crea una nueva categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada con éxito.' })
  @ApiBody({ type: CreateCategoryDto }) 
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }
  
  // ... (Aquí deberías añadir tus endpoints de UPDATE (Patch) y DELETE)
  // ... (Esos dos (update y remove) SÍ deberían llevar los mismos guards que el POST)
}