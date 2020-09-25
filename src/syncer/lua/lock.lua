local lock_key = KEYS[1]
local store_key = KEYS[2]
local chat_id = ARGV[1]
local store = ARGV[2]
local expires = ARGV[3]

local exists = redis.call('exists', lock_key)

if (exists == 1) then
  return 'NOT_OK'
end

-- We should only create a lock when there is no lock

redis.call('set', lock_key, chat_id, 'PX', expires)
redis.call('set', store_key, store)

return 'OK'
