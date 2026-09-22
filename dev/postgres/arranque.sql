-- El primer tenant y el primer usuario · 2026-09-22
--
-- **Es lo único que el setup del backend no trae.** Con `DB_AUTO_MIGRATE=true`
-- el binario crea el esquema, corre las migraciones manuales y siembra el
-- dashboard — pero `seedDDDefaultDashboard` y `seedDDPanelData` iteran los
-- tenants EXISTENTES. Sobre una base vacía no hay ninguno, así que no siembran
-- nada y la consola arranca sin una sola métrica.
--
-- No hay herramienta de alta: no existe un `cmd/bootstrap` ni una ruta pública
-- que cree el primer administrador. Así que el arranque se inserta.
--
--   docker exec -i synapse-db-local psql -U synapse -d synapse < dev/postgres/arranque.sql
--   # y se REINICIA el backend: los seeds corren al abrir la conexión
--
-- **Las credenciales de Snowflake van vacías a propósito.** Sin ellas el
-- materializador no puede consultar nada, y está bien: los paneles se llenan
-- con `seedDDPanelData`, que son fixtures. Una base local no debe poder pegarle
-- a Snowflake por accidente.
--
-- El hash es bcrypt de «synapse», generado una vez y fijo acá: que la clave de
-- una base local esté escrita en el repositorio es correcto, y que la real no
-- lo esté también.

INSERT INTO tenants (id, name, snowflake_url, snowflake_account, snowflake_user,
                     snowflake_role, private_key_pem, private_key_passphrase,
                     kms_key_arn, created_at, updated_at)
VALUES ('11111111-1111-4111-8111-111111111111', 'Under Armour México',
        '', '', '', '', '', '', '', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- **El rol se llama `admin` en minúscula.** El front compara contra
-- `roles.name` normalizando la mayúscula, así que `Admin` también entraría;
-- se deja como lo escribe el backend.
INSERT INTO roles (id, tenant_id, name, created_at, updated_at)
VALUES ('22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name,
                   role_id, password_updated, theme, created_at, updated_at)
VALUES ('33333333-3333-4333-8333-333333333333',
        '11111111-1111-4111-8111-111111111111',
        'dev@synapse.local',
        '$2a$10$h3LyN0UVt9TZhYhpl9GDWew183msvuHILrMmYVAvGOG3Nt7FCHwGO',
        'Dev', 'Local',
        '22222222-2222-4222-8222-222222222222',
        true, 'dark', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
