import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Project } from '../../projects/entities/project.entity'
import { User } from '../../user/entities/user.entity'

const hoursTransformer = {
  to: (value?: number) => value,
  from: (value: string) => Number.parseFloat(value),
}

@Entity('time_assignments')
@Index(['projectId'])
@Index(['userId'])
export class TimeAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'project_id' })
  projectId: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'start_date', type: 'date' })
  startDate: string

  @Column({ name: 'end_date', type: 'date' })
  endDate: string

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: hoursTransformer })
  hours: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
