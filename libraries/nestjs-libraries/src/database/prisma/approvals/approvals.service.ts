import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { escape } from 'lodash';
import { ApprovalsRepository } from '@gitroom/nestjs-libraries/database/prisma/approvals/approvals.repository';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { NotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/notification.service';
import { ApprovalDecisionDto } from '@gitroom/nestjs-libraries/dtos/approvals/approval.decision.dto';

const LINK_DAYS = 7;

@Injectable()
export class ApprovalsService {
  constructor(
    private _approvalsRepository: ApprovalsRepository,
    private _postsService: PostsService,
    private _notificationService: NotificationService
  ) {}

  async createLink(orgId: string, group: string) {
    // the same checks the client's approval runs, so the team fixes the post
    // before sending the link
    await this._postsService.getApprovableDrafts(orgId, group);
    await this._approvalsRepository.closeOpen(orgId, group);
    return this._approvalsRepository.create(
      orgId,
      group,
      randomBytes(24).toString('hex'),
      dayjs().add(LINK_DAYS, 'day').toDate()
    );
  }

  getLatest(orgId: string, group: string) {
    return this._approvalsRepository.getLatest(orgId, group);
  }

  private async load(token: string) {
    const approval = await this._approvalsRepository.getByToken(token);
    if (!approval) {
      throw new NotFoundException('This approval link does not exist');
    }
    return {
      approval,
      expired: dayjs(approval.expiresAt).isBefore(dayjs()),
    };
  }

  async getForClient(token: string) {
    const { approval, expired } = await this.load(token);
    if (expired) {
      return {
        status: 'EXPIRED',
        expiresAt: approval.expiresAt,
        brand: null,
        posts: [],
      };
    }
    const preview = await this._postsService.getApprovalPreview(
      approval.organizationId,
      approval.group
    );
    return {
      status: approval.status,
      expiresAt: approval.expiresAt,
      decidedBy: approval.decidedBy,
      decidedAt: approval.decidedAt,
      brand: preview.brand,
      posts: preview.posts.map(({ state, ...p }) => p),
    };
  }

  async decide(token: string, body: ApprovalDecisionDto) {
    const { approval, expired } = await this.load(token);
    if (expired) {
      throw new HttpException('This approval link has expired', 410);
    }
    const name = body.name.trim();
    const note = (body.note || '').trim();
    if (!name) {
      throw new BadRequestException('Write your name');
    }
    if (body.decision === 'changes' && !note) {
      throw new BadRequestException('Write what should change');
    }

    const claimed = await this._approvalsRepository.claim(
      approval.id,
      body.decision === 'approve' ? 'APPROVED' : 'CHANGES_REQUESTED',
      name,
      body.decision === 'approve' ? null : note
    );
    if (!claimed) {
      throw new BadRequestException('This post was already answered');
    }

    // client text is escaped, notifications are shown as HTML
    const who = escape(name);

    if (body.decision === 'changes') {
      await this._postsService.addApprovalNote(
        approval.organizationId,
        approval.group,
        name,
        note
      );
      await this._notificationService.inAppNotification(
        approval.organizationId,
        `${who} asked for changes`,
        `${who} asked for changes to a post. Open the post preview to read the note.`,
        true
      );
      return { status: 'CHANGES_REQUESTED' };
    }

    try {
      await this._postsService.scheduleApprovedDrafts(
        approval.organizationId,
        approval.group
      );
    } catch (err) {
      await this._approvalsRepository.reopen(approval.id);
      throw err;
    }
    await this._notificationService.inAppNotification(
      approval.organizationId,
      `${who} approved a post`,
      `${who} approved a post. It is now scheduled.`,
      true
    );
    return { status: 'APPROVED' };
  }
}
