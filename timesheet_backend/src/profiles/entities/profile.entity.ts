import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

const costTransformer = {
  to: (value?: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number.parseFloat(value)),
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  discipline: string

  @Column()
  level: string

  @Column({
    name: 'cost_per_hour',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: costTransformer,
  })
  costPerHour: number

  @Column({ default: true })
  active: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
