import sqlite3
import uuid
from datetime import datetime,timezone
from pathlib import Path
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

def get_conversations(conversation_id:str)-> dict|None:
    conn=get_db()
    try:
        row=conn.execute(
            "select id,title,created_at,updated_at from conversations where title=?",
            (conversation_id,)
        ).fetchone()
        return dict(row)if row else None
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
            "delect from conversations where id=?",conversation_id)
        conn.commit()
        return cursor.rowcount>0
    finally:
        conn.close()


def get_messages(conversation_id:str)->list[dict]:
    conn=get_db()
    try:
        rows=conn.execute("""select id,conversation_id,role,content,created_at
         from messages
         where id=?
         order by created_at acs""",(conversation_id,)
                          ).fetchall()
        conn.commit()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_conversation()->list[dict]:
    conn=get_db()
    try:
        rows=conn.execute("""select id ,title,created_at,updated_at
        from conversations id 
        order by updated_at desc""").fetchall()
        conn.commit()
        return [dict(row)for row in rows]
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    c = create_conversations("测试会话")
    print("创建会话:", c)
    print("查询会话:", get_conversations(c["id"]))
    m = add_message(c["id"], "user", "你好")
    print("添加消息:", m)
    # 删会话，验证消息级联删除
    # delete_conversation(c["id"])
