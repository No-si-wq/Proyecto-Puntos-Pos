import cron from 'node-cron';
import { QuotationService } from './quotation.service';

const service = new QuotationService();

export function startQuotationCron() {
  // Corre todos los días a medianoche
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await service.expireOverdue();
      console.log(`[QuotationCron] Cotizaciones expiradas: ${result.count}`);
    } catch (err) {
      console.error('[QuotationCron] Error al expirar cotizaciones:', err);
    }
  });
}