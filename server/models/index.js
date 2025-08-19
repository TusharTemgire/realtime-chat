import { Sequelize, DataTypes } from "sequelize"
import dotenv from "dotenv"

dotenv.config()

// Database connection
const sequelize = new Sequelize(
    process.env.DB_NAME || "chat_app",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "", {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    },
)

// User model
const User = sequelize.define(
    "User", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        avatar_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        is_online: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        last_seen: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    },
)

// Conversation model
const Conversation = sequelize.define(
    "Conversation", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user1_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        user2_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
    }, {
        tableName: "conversations",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [{
                fields: ["user1_id", "user2_id"],
            },
            {
                fields: ["user2_id", "user1_id"],
            },
        ],
    },
)

// Message model
const Message = sequelize.define(
    "Message", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        conversation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Conversation,
                key: "id",
            },
        },
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        message_type: {
            type: DataTypes.ENUM("text", "image", "file"),
            defaultValue: "text",
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: "messages",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [{
                fields: ["conversation_id", "created_at"],
            },
            {
                fields: ["sender_id"],
            },
        ],
    },
)

// TypingIndicator model
const TypingIndicator = sequelize.define(
    "TypingIndicator", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        conversation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Conversation,
                key: "id",
            },
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: "id",
            },
        },
        is_typing: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: "typing_indicators",
        timestamps: false,
        updatedAt: "updated_at",
        indexes: [{
            unique: true,
            fields: ["conversation_id", "user_id"],
        }, ],
    },
)

// Define associations
User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" })
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" })

Conversation.hasMany(Message, { foreignKey: "conversation_id", as: "messages" })
Message.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" })

// Conversation user associations
Conversation.belongsTo(User, { foreignKey: "user1_id", as: "user1" })
Conversation.belongsTo(User, { foreignKey: "user2_id", as: "user2" })
User.hasMany(Conversation, { foreignKey: "user1_id", as: "conversationsAsUser1" })
User.hasMany(Conversation, { foreignKey: "user2_id", as: "conversationsAsUser2" })

User.belongsToMany(User, {
    through: Conversation,
    as: "chatPartners",
    foreignKey: "user1_id",
    otherKey: "user2_id",
})

Conversation.hasMany(TypingIndicator, { foreignKey: "conversation_id", as: "typingIndicators" })
TypingIndicator.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" })

User.hasMany(TypingIndicator, { foreignKey: "user_id", as: "typingIndicators" })
TypingIndicator.belongsTo(User, { foreignKey: "user_id", as: "user" })

// Sync database (for development)
if (process.env.NODE_ENV === "development") {
    try {
        await sequelize.authenticate()
        console.log("Database connection established successfully.")

        await sequelize.sync({ alter: true })
        console.log("Database synchronized successfully.")
    } catch (error) {
        console.error("Unable to connect to the database:", error)
    }
}

export { sequelize, User, Conversation, Message, TypingIndicator }