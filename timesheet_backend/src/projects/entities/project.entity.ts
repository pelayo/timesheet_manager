import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
