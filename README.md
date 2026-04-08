# @geeklabssh/hive-tablepro

Pacote privado com o fork de **MUI Material**, **MUI System** e **MUI X Data Grid** (Community / Pro / Premium) usado pela aplicação ProtonWeb.

## Consumo no ProtonWeb hoje (Docker mais leve)

O front instala o pacote a partir do **mesmo artefacto** que usarias no registry privado: um ficheiro **`vendor/geeklabssh-hive-tablepro-1.0.0.tgz`** gerado com `npm pack`.

Código-fonte publicável: https://github.com/GeekLabsSH/hive-tablepro

- Em `package.json` do ProtonWeb: `"@geeklabssh/hive-tablepro": "file:./vendor/geeklabssh-hive-tablepro-1.0.0.tgz"`.
- Imports na app: `@geeklabssh/hive-tablepro/core/...`.
- Next.js: `transpilePackages: ['@geeklabssh/hive-tablepro']` em `next.config.js`.
- O **contexto Docker** ignora a pasta `hive-tablepro/` (muito maior) via `.dockerignore` na raiz do repositório; a imagem só precisa de `package.json`, `package-lock.json` e `vendor/*.tgz`.

### Fonte local vs pacote instalado (`HIVE_TABLEPRO_SOURCE`)

Em desenvolvimento no monorepo podes apontar o Next.js para a **pasta** `ProtonWeb/hive-tablepro/` (código-fonte do fork) em vez do pacote descompactado em `node_modules`:

| Valor | Comportamento |
|-------|----------------|
| *(omitido)* ou `npm` | Usa `@geeklabssh/hive-tablepro` resolvido pelo npm (`file:./vendor/...tgz` ou versão publicada). |
| `local` | Alias Webpack para `./hive-tablepro` — alterações no fork refletem-se sem `npm run vendor:tablepro` a cada passo. |

Definição típica em `ProtonWeb/.env.local`:

```bash
HIVE_TABLEPRO_SOURCE=local
```

No PowerShell (sessão atual): `$env:HIVE_TABLEPRO_SOURCE='local'; npm run dev`

Para validar o fluxo **igual à CI/produção** (só tarball ou registry), remove a variável ou usa `HIVE_TABLEPRO_SOURCE=npm`.

### Atualizar o tarball depois de mudar o fork

Na pasta `ProtonWeb`:

```bash
npm run vendor:tablepro
npm install
```

Isto recria `vendor/geeklabssh-hive-tablepro-1.0.0.tgz` e, se o conteúdo mudar, atualiza o `integrity` no `package-lock.json`. Faça commit do `.tgz` e do lock quando publicar uma nova versão interna.

---

## Publicar em registry npm **privado** (GitHub Packages)

O fluxo oficial é o mesmo do npm: publicar o pacote com scope e instalar com `npm install` + `.npmrc` com token.

1. **Scope e GitHub**  
   No GitHub Packages o scope tem de estar em **minúsculas** e alinhado com a organização ou utilizador que detém o pacote. Ex.: se o teu GitHub for `minhaempresa`, o nome do pacote deverá ser algo como `@minhaempresa/tablepro` (podes renomear em `hive-tablepro/package.json` e ajustar imports com um codemod, se saíres de `@geeklabssh/hive-tablepro`).

2. **`private` e `npm publish`**  
   O npm **não publica** pacotes com `"private": true`. Para publicar no GitHub Packages, remove temporariamente `"private": true` **ou** mantém apenas o fluxo `npm pack` + upload manual ao registry, conforme a tua política. O `publishConfig.registry` já aponta para `https://npm.pkg.github.com`.

3. **`.npmrc` no ProtonWeb** (local ou CI; **nunca** commitar o token)  
   Vê `ProtonWeb/.npmrc.example`. Linha típica:

   ```ini
   @geeklabssh:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```

4. **Trocar a dependência no ProtonWeb**  
   Depois da primeira publicação bem-sucedida:

   ```json
   "@geeklabssh/hive-tablepro": "1.0.0"
   ```

   Correr `npm install`, commit do `package-lock.json`, e **remover** a cópia em `vendor/` se já não precisares do modo tarball.

5. **Docker só com registry**  
   Deixa de copiar `vendor/` no `Dockerfile`. Antes de `npm ci`, cria um `.npmrc` com o token (idealmente [BuildKit secret](https://docs.docker.com/build/building/secrets/), não `ARG` em imagens partilhadas), executa `npm ci` e apaga o `.npmrc`.

### Bit (Bit.dev) ou outros registos privados

O mecanismo é o mesmo: publicar `@scope/pacote`, configurar `@scope:registry=...` no `.npmrc` e autenticar com o token que a plataforma indicar. O artefacto continua a ser um tarball npm compatível com `npm install`.

---

## Resumo

| Objetivo | O que usar |
|----------|------------|
| Imagem Docker sem enviar a pasta gigante `hive-tablepro/` no contexto | `vendor/geeklabssh-hive-tablepro-1.0.0.tgz` + `.dockerignore` em `hive-tablepro/` |
| Consumo “só npm” a partir de GitHub/Bit privado | Versão semântica no `package.json`, `.npmrc` com token, `npm install` / `npm ci` |
| Não expor código no npm público | Registry privado + pacote com acesso restrito à organização; não publicar em `registry.npmjs.org` sem controlo |

---

## CI no monorepo (GitHub Actions)

No repositório **protonerp** existe o workflow `.github/workflows/publish-hive-tablepro.yml`:

1. **Manual:** *Actions* → *Publish hive-tablepro* → *Run workflow*. Por defeito **dry run** (`npm pack` + validações). Desmarque *dry_run* para executar `npm publish` no GitHub Packages (usa `GITHUB_TOKEN` com `packages: write`).
2. **Por tag:** faça bump da versão em `hive-tablepro/package.json`, commit, depois crie e envie uma tag `hive-tablepro-v1.0.1` (prefixo obrigatório). O workflow publica automaticamente.

**Nota:** Se o fork do pacote viver noutro repositório (ex.: só `GeekLabsSH/hive-tablepro`), copie o mesmo workflow para a raiz desse repo e ajuste `working-directory` para `.`.

Antes de publicar, confirme que o **scope** `@geeklabssh` corresponde ao **owner** do repositório no GitHub (utilizador ou organização, em minúsculas).
