import type { MonthlyReport, PrismaClient, YearlyReport } from '../../generated/prisma/client.js';
import { NotFoundError } from '../../utils/appError.js';
import type { RefreshMonthlyReportInput } from './reports.schema.js';

export class ReportsService {
  constructor(private readonly prisma: PrismaClient) {}

  async monthlyReports(): Promise<MonthlyReport[]> {
    return this.prisma.monthlyReport.findMany({ orderBy: { id: 'asc' } });
  }

  async monthlyReportByName(monthName: string): Promise<MonthlyReport> {
    const report = await this.prisma.monthlyReport.findFirst({
      where: { month_name: monthName },
    });
    if (!report) throw new NotFoundError('Monthly report');
    return report;
  }

  /**
   * Aggregates fuel_logs over [firstDatePrev, lastDatePrev) and upserts the
   * resulting row into monthly_reports — all inside one transaction so the
   * stored aggregate can never drift from its source data mid-write.
   */
  async refreshMonthlyReport(input: RefreshMonthlyReportInput): Promise<MonthlyReport> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ total: number | null; fills: bigint }[]>`
        SELECT COALESCE(SUM("filled_liters"), 0) AS total, COUNT(*) AS fills
        FROM "fuel_logs"
        WHERE "transaction_date" >= ${input.firstDatePrev}
          AND "transaction_date" < ${input.lastDatePrev}`;
      const agg = rows[0] ?? { total: 0, fills: 0n };

      const values = {
        total_diesel: Number(agg.total ?? 0),
        total_fills: Number(agg.fills),
        first_date: input.firstDatePrev,
        last_date: input.lastDatePrev,
      };

      return tx.monthlyReport.upsert({
        where: { month_name: input.period },
        create: { month_name: input.period, ...values },
        update: values,
      });
    });
  }

  async yearlyReports(): Promise<YearlyReport[]> {
    return this.prisma.yearlyReport.findMany({ orderBy: { id: 'asc' } });
  }
}
