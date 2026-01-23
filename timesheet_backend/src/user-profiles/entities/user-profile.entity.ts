import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

const costPerHourTransformer = {
  to: (value?: number) => value,
  from: (value: string) => Number.parseFloat(value),
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'text' })
  discipline: string

  @Column({ type: 'text' })
  level: string

  @Column({ name: 'cost_per_hour', type: 'numeric', precision: 10, scale: 2, transformer: costPerHourTransformer })
  costPerHour: number

  @Column({ default: true })
  active: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
