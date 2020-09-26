local lock_key = KEYS[1]
local expires = ARGV[1]

local chat_id = redis.call('get', lock_key)

if (not chat_id) then
  return 'NOT_OK'
end

redis.call('set', lock_key, chat_id, 'PX', expires)

return 'OK'
