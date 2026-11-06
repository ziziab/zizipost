import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class ApprovalsRepository {
  constructor(private _approvals: PrismaRepository<'postApproval'>) {}

  // a new link replaces the older links of the same post
  closeOpen(orgId: string, group: string) {
    return this._approvals.model.postApproval.updateMany({
      where: {
        organizationId: orgId,
        group,
        expiresAt: { gt: new Date() },
      },
      data: {
        expiresAt: new Date(),
      },
    });
  }

  create(orgId: string, group: string, token: string, expiresAt: Date) {
    return this._approvals.model.postApproval.create({
      data: {
        organizationId: orgId,
        group,
        token,
        expiresAt,
      },
      select: {
        token: true,
        status: true,
        expiresAt: true,
      },
    });
  }

  getLatest(orgId: string, group: string) {
    return this._approvals.model.postApproval.findFirst({
      where: {
        organizationId: orgId,
        group,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        token: true,
        status: true,
        expiresAt: true,
        decidedBy: true,
        decidedAt: true,
        note: true,
      },
    });
  }

  getByToken(token: string) {
    return this._approvals.model.postApproval.findUnique({
      where: {
        token,
      },
    });
  }

  // only one answer wins, even when the client clicks twice
  async claim(
    id: string,
    status: ApprovalStatus,
    decidedBy: string,
    note: string | null
  ) {
    const { count } = await this._approvals.model.postApproval.updateMany({
      where: {
        id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      data: {
        status,
        decidedBy,
        note,
        decidedAt: new Date(),
      },
    });
    return count === 1;
  }

  reopen(id: string) {
    return this._approvals.model.postApproval.update({
      where: {
        id,
      },
      data: {
        status: 'PENDING',
        decidedBy: null,
        note: null,
        decidedAt: null,
      },
      select: {
        id: true,
      },
    });
  }
}
