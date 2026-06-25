// ============================================================
// features/admin-hero — CRUD admin des slides du carrousel Hero
// de la page d'accueil.
// ============================================================

export { useAdminHero } from './api/useAdminHero';
export { useHeroSlide } from './api/useHeroSlide';
export { useCreateHeroSlide } from './api/useCreateHeroSlide';
export { useUpdateHeroSlide } from './api/useUpdateHeroSlide';
export { useDeleteHeroSlide } from './api/useDeleteHeroSlide';
export { useReorderHeroSlides } from './api/useReorderHeroSlides';

export { heroSlideSchema, HERO_MEDIA_TYPES } from './schemas/heroSlide.schema';
