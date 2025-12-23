import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember, ProjectRole } from './entities/project-member.entity';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
  ) {}

  async addMember(projectId: string, dto: CreateProjectMemberDto): Promise<ProjectMember> {
    const exists = await this.memberRepository.findOne({
      where: { projectId, userId: dto.userId },
    });
    if (exists) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.memberRepository.create({
      projectId,
      userId: dto.userId,
      role: dto.role || ProjectRole.MEMBER,
    });

    return this.memberRepository.save(member);
  }

  async findAll(projectId: string): Promise<ProjectMember[]> {
    return this.memberRepository.find({
      where: { projectId },
      relations: ['user'],
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    await this.memberRepository.remove(member);
  }
}
