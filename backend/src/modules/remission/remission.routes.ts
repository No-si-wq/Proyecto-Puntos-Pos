import { Router } from 'express';
import { remissionController } from './remission.controller';
import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { createRemissionSchema } from './remission.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', remissionController.findAll);
router.get('/:id', remissionController.findOne);
router.post('/', validate(createRemissionSchema), remissionController.create);
router.patch('/:id/cancel', remissionController.cancel);
router.patch('/:id/deliver', remissionController.deliver);

export default router;