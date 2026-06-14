# Mini Booking API — Laravel 13 on PHP 8.3.
FROM php:8.3-cli

# System libs + PHP extensions. pdo_mysql works for both local MySQL 8 and
# TiDB Cloud (same wire protocol); the OS CA bundle (ca-certificates, pulled in
# here) lets TiDB's TLS connection verify without a custom cert.
RUN apt-get update && apt-get install -y --no-install-recommends \
      git unzip libzip-dev libonig-dev default-mysql-client \
    && docker-php-ext-install pdo_mysql zip mbstring bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies first for better layer caching.
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader

COPY . .
RUN composer dump-autoload --optimize

RUN chmod +x docker/entrypoint.sh

EXPOSE 8000
CMD ["sh", "docker/entrypoint.sh"]
