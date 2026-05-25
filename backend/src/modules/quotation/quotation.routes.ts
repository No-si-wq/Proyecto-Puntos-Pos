import { Router } from 'express';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { validate } from '../../core/middlewares/validate.middleware';
import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { QuotationController } from './quotation.controller';
import { createQuotationSchema, updateQuotationStatusSchema } from './quotation.schema';

const router = Router();
const ctrl = new QuotationController();

router.use(authMiddleware);

router.get('/', asyncHandler(ctrl.getAll.bind(ctrl)));
router.get('/:id', asyncHandler(ctrl.getById.bind(ctrl)));
router.post('/', validate(createQuotationSchema), asyncHandler(ctrl.create.bind(ctrl)));
router.patch('/:id/status', validate(updateQuotationStatusSchema), asyncHandler(ctrl.updateStatus.bind(ctrl)));
router.post('/:id/convert', asyncHandler(ctrl.convertToSale.bind(ctrl)));

export default router;