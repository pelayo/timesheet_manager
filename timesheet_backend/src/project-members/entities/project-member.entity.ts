import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../user/entities/user.entity';

export enum ProjectRole {
  MEMBER = 'MEMBER',
  LEAD = 'LEAD',
}

@Entity('project_members')
export class ProjectMember {
  @PrimaryColumn({ name: 'project_id' })
  projectId: string;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', default: ProjectRole.MEMBER })
  role: ProjectRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
