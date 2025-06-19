import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, length: 16 })
    user_name!: string;

    @Column()
    password!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created!: Date;
}
