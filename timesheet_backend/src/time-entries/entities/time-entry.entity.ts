import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Unique, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('time_entries')
@Unique(['userId', 'taskId', 'workDate'])
@Index(['workDate'])
@Index(['taskId'])
@Index(['userId', 'workDate'])
@Index(['teamworkId'], { unique: true })
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'work_date', type: 'date' })
  workDate: string;

  @Column({ type: 'int' })
  minutes: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'teamwork_id', type: 'text', nullable: true })
  teamworkId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
