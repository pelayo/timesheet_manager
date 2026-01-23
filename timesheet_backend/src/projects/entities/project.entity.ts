import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

const budgetTransformer = {
  to: (value?: number) => value,
  from: (value: string | null) => (value === null ? null : Number.parseFloat(value)),
};

@Entity('projects')
@Index(['name'])
@Index(['isGlobal', 'isArchived'])
@Index(['teamworkId'], { unique: true })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ name: 'teamwork_id', type: 'text', nullable: true })
  teamworkId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false, name: 'is_archived' })
  isArchived: boolean;

  @Column({ default: false, name: 'is_global' })
  isGlobal: boolean;

  @Column({
    name: 'budget_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: budgetTransformer,
  })
  budgetAmount: number;

  @Column({ type: 'text', default: 'USD' })
  currency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
