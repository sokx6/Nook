import sqlite3
import uuid
from datetime import datetime,timezone
from pathlib import Path
from app.schemas import ConversationInfo
DB_PATH=Path(__file__).parent.parent.parent/"data"/"chatbot.sqlite3"

def get_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn=sqlite3.connect(DB_PATH)
    conn.row_factory=sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id()->str:
    return str(uuid.uuid4())

def init_db():
    conn=get_db()
    try:
      conn.executescript("""
     CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
     );
     CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id)
            REFERENCES conversations (id) ON DELETE CASCADE
     );
     """)
      conn.commit()
    finally:
      conn.close()



def create_conversations(title:str|None=None)-> dict:
    if title is None:
        title="New Conversation"
    conn=get_db()
    try:
        cid=new_id()
        ts=now()
        conn.execute(
            "insert into conversations(id,title,created_at,updated_at)values(?,?,?,?)",
            (cid,title,ts,ts),
        )
        conn.commit()
        return {"id":cid,"title":title,"created_at":ts,"updated_at":ts}
    finally:
        conn.close()

def get_conversation(conversation_id:str)-> ConversationInfo|None:
    conn=get_db()
    try:
        row=conn.execute(
            "select id,title,created_at,updated_at from conversations where id=?",
            (conversation_id,)
        ).fetchone()
        return ConversationInfo(**dict(row)) if row else None
    finally:
        conn.close()

def add_message(conversation_id:str,role:str,content:str) ->dict|None:
    conn=get_db()
    try:
        mid,now_ts=new_id(),now()
        conn.execute(
            """insert into messages
            (id,conversation_id,role,content,created_at)
            values(?,?,?,?,?)""",
            (mid,conversation_id,role,content,now_ts))
        conn.execute(
            "update conversations set updated_at=? where id=?",
            (now_ts,conversation_id)
        )
        conn.commit()
        return{"id":mid,"conversation_id":conversation_id,"role":role,"content":content,"created_at":now_ts}
    finally:
        conn.close()


def delete_conversation(conversation_id:str) -> bool:
    conn=get_db()
    try:
        cursor=conn.execute(
            "delete from conversations where id=?", (conversation_id,))
        conn.commit()
        return cursor.rowcount>0
    finally:
        conn.close()


def get_messages(conversation_id:str)->list[dict]:
    conn=get_db()
    try:
        rows=conn.execute("""select id,conversation_id,role,content,created_at
         from messages
         where conversation_id=?
         order by created_at asc""",(conversation_id,)
                          ).fetchall()
        conn.commit()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_conversations()->list[ConversationInfo]|list[dict]:
    conn=get_db()
    try:
        rows=conn.execute("""select id ,title,created_at,updated_at
        from conversations 
        order by updated_at desc""").fetchall()
        conn.commit()
        return [ConversationInfo(**dict(row)) for row in rows]
    finally:
        conn.close()


def clear_messages(conversation_id:str)->bool:
    conn=get_db()
    try:
        cursor=conn.execute("""
        delete 
        from messages 
        where conversation_id=?""", (conversation_id,))
        conn.commit()
        return cursor.rowcount>0
    finally:
        conn.close()

def delete_message(conversation_id: str, message_id: str) -> bool:
    conn = get_db()
    try:
        cursor = conn.execute(
            "delete from messages where id=? and conversation_id=?",
            (message_id, conversation_id),
        )
        if cursor.rowcount > 0:
            conn.execute(
                "update conversations set updated_at=? where id=?",
                (now(), conversation_id),
            )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
        
def search_conversations(keyword: str) -> list[ConversationInfo]:
    conn = get_db()
    try:
        rows = conn.execute(
            """select id, title, created_at, updated_at
            from conversations
            where title like ?
            order by updated_at desc""",
            (f"%{keyword}%",),
        ).fetchall()
        return [ConversationInfo(**dict(row)) for row in rows]
    finally:
        conn.close()
        
def search_conversations_by_all(keyword: str) -> list[ConversationInfo]:
    conn = get_db()
    try:
        pattern = f"%{keyword}%"
        rows = conn.execute(
            """
            SELECT DISTINCT c.id, c.title, c.created_at, c.updated_at
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.title LIKE ?
               OR m.content LIKE ?
            ORDER BY c.updated_at DESC
            """,
            (pattern, pattern)
        ).fetchall()
        return [ConversationInfo(**row) for row in rows]
    finally:
        conn.close()
        
def update_title(conversation_id: str, new_title: str) -> bool:
    conn = get_db()
    try:
        cursor = conn.execute(
            "UPDATE conversations SET title=?, updated_at=? WHERE id=?",
            (new_title, now(), conversation_id),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()