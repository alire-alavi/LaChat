import { Entity, OneToMany, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Participant } from '../chat/chat.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, length: 16 })
    user_name!: string;

    @OneToMany(() => Participant, (participant: Participant) => participant.conversation, {
        cascade: true,
    })
    participants!: Participant[];

    @Column()
    password!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created!: Date;
}
