import { Entity, Column, PrimaryColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity()
@Index(['date'])
@Index(['week'])
@Index(['month'])
@Index(['projectId'])
@Index(['userId'])
export class DatalakeEntry {
  @PrimaryColumn()
  id: string; // Corresponds to TimeEntry id (UUID)

  @Column()
  userId: string;

  @Column()
  projectId: string;

  @Column({ nullable: true })
  taskId: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  week: string; // YYYY-WW

  @Column()
  month: string; // YYYY-MM

  @Column()
  year: string; // YYYY

  @Column()
  minutes: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;
}
