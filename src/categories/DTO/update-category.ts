// update-category.dto.ts
export class UpdateCategoryDto {
  nombre?: string;
  slug?: string;
  id_padre?: string | null;
}