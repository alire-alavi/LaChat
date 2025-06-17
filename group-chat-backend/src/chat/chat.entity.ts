import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from 'src/auth/user.entity';

/**
 * Represents a chat message, either from a user or a system message.
 * - System messages have user=null.
 * - Reply messages link to another Message.
 */
@Entity({ name: 'messages' })
export class Message {
    @PrimaryGeneratedColumn()
    id!: number;

    /**
     * The user who sent the message, or null for system messages.
     */
    @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    /**
     * The text content of the message.
     */
    @Column({ type: 'varchar', length: 2000 })
    message!: string;

    /**
     * When the message was created (UTC).
     */
    @CreateDateColumn({ type: 'timestamptz' })
    date!: Date;

    /**
     * If this message is a reply, references the original message.
     */
    @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL', eager: false })
    @JoinColumn({ name: 'reply_to' })
    reply_to?: Message;
}
