template = '''
echo "Team whileLOOP"
echo "UCSC Results Center Configuration File"
echo ""

# Database configuration
echo "Exporting Database Configurations"
export AWS_RDB_HOST='{AWS_RDB_HOST}'
export AWS_RDB_USERNAME='{AWS_RDB_USERNAME}'
export AWS_RDB_PASSWORD='{AWS_RDB_PASSWORD}'
export AWS_RDB_DATABASE='{AWS_RDB_DATABASE}'

# Server configurations
echo "Exporting Server Configurations"
export DEV_ENV='{DEV_ENV}'
export PORT={PORT}
export UCSC_RESULTS_CENTER_ACCESSTOKEN='{UCSC_RESULTS_CENTER_ACCESSTOKEN}'

# Mailman configurations
echo "Exporting Mailman Configurations"
export MAILMAN_EMAIL='{MAILMAN_EMAIL}'
export MAILMAN_PASSWORD='{MAILMAN_PASSWORD}'
export RESCENT_ACCESS_TOKEN='{RESCENT_ACCESS_TOKEN}'

# RSA configurations
echo "Exporting RSA Configurations"
export RSA_KEY='{RSA_KEY}'
export RSA_CERT='{RSA_CERT}'

# Monitoring client configurations
echo "Exporting Monitoring Client Configurations"
export MONIT_WAIT_TIME='{MONIT_WAIT_TIME}'

# Facebook configurations
echo "Exporting Facebook Configurations"
export FB_VERIFY_TOKEN='{FB_VERIFY_TOKEN}'
export FB_PAGE_TOKEN='{FB_PAGE_TOKEN}'

# Settings
echo "Exporting Feature Configurations"
export ENABLE_EMAILS='{ENABLE_EMAILS}'
export MESSENGER_INTERGRATIONS='{MESSENGER_INTERGRATIONS}'

# Backup Manager
echo "Backup Manager Configurations"
export SQL_BACKUP_DIR='{SQL_BACKUP_DIR}'


echo "Done"'''

template = template.replace('{AWS_RDB_HOST}', raw_input('Database Host IP > '))
template = template.replace('{AWS_RDB_USERNAME}', raw_input('Database Username > '))
template = template.replace('{AWS_RDB_PASSWORD}', raw_input('Database Password > '))
template = template.replace('{AWS_RDB_DATABASE}', raw_input('Database Name > '))

template = template.replace('{DEV_ENV}', raw_input('Setup as Development Environment > ') or 'true')
template = template.replace('{PORT}', raw_input('HTTP Web Port > '))
template = template.replace('{UCSC_RESULTS_CENTER_ACCESSTOKEN}', raw_input('API Access Token > '))

template = template.replace('{MAILMAN_EMAIL}', raw_input('Mailman Email Address > '))
template = template.replace('{MAILMAN_PASSWORD}', raw_input('Mailman Password > '))
template = template.replace('{RSA_KEY}', raw_input('RSA Key Location > '))
template = template.replace('{RSA_CERT}', raw_input('RSA Certificate Location > '))

template = template.replace('{MONIT_WAIT_TIME}', raw_input('Monitoring Client Scan Interval > '))
template = template.replace('{RESCENT_ACCESS_TOKEN}', raw_input('Access Token for API > '))

template = template.replace('{FB_VERIFY_TOKEN}', raw_input('Facebook WebHook Token > '))
template = template.replace('{FB_PAGE_TOKEN}', raw_input('Facebook Page Token > '))

template = template.replace('{ENABLE_EMAILS}', raw_input('Enable Emails > '))
template = template.replace('{MESSENGER_INTERGRATIONS}', raw_input('Enable Messenger Intergrations > '))

template = template.replace('{SQL_BACKUP_DIR}', raw_input('Database backup location > '))

f = open("config.sh", "w")
f.write(template)

print 'Done.'