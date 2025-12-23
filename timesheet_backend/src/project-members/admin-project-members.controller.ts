import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { ProjectMembersService } from './project-members.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../user/entities/role.enum';

@Controller('admin/projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Roles(Role.Admin)
export class AdminProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

  @Post(':projectId/members')
  async addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectMemberDto
  ): Promise<ProjectMemberResponseDto> {
    const member = await this.membersService.addMember(projectId, dto);
    return plainToInstance(ProjectMemberResponseDto, member, { excludeExtraneousValues: true });
  }

  @Get(':projectId/members')
  async findAll(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<ProjectMemberResponseDto[]> {
    const members = await this.membersService.findAll(projectId);
    return members.map(m => plainToInstance(ProjectMemberResponseDto, m, { excludeExtraneousValues: true }));
  }

  @Delete(':projectId/members/:userId')
  async removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string
  ): Promise<void> {
    await this.membersService.removeMember(projectId, userId);
  }
}
