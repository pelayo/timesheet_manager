import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { User } from '../../user/entities/user.entity'

const costTransformer = {
  to: (value?: number) => value,
  from: (value: string) => Number.parseFloat(value),
}

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  discipline: string

  @Column()
  level: string

  @Column({ name: 'cost_per_hour', type: 'numeric', precision: 10, scale: 2, transformer: costTransformer })
  costPerHour: number

  @Column({ default: true })
  active: boolean

  @OneToMany(() => User, (user) => user.profile)
  users: User[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
