local lock_key = KEYS[1]
local store_key = KEYS[2]
local chat_id = ARGV[1]
local store = ARGV[2]
local expires = ARGV[3]

local locked = redis.call('get', lock_key)

if (locked == nil) then
  -- It is already unlocked, however, it is ok
  return 'OK'
end

if (locked == chat_id) then
  redis.call('del', lock_key)
  redis.call('set', store_key, store)

  return 'OK'
end

-- The lock is not owned by the current session
return 'NOT_OK'
