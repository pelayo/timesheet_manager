import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity'

const hoursTransformer = {
  to: (value?: number) => value,
  from: (value: string) => Number.parseFloat(value),
}

@Entity('standard_hours')
@Index(['userId'], { unique: true })
export class StandardHours {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: hoursTransformer })
  hours: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
