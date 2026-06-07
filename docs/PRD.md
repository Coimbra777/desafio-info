# PRD.md — Plataforma de Gestão de Frota Aivacol

## 1. Visão Geral

Este projeto tem como objetivo construir o backend de um módulo de Gestão de Frota para a Aivacol.

A aplicação deve permitir o cadastro, consulta, atualização e remoção de modelos de veículos e veículos. Também deve garantir autenticação segura, cache para consultas de veículos, testes automatizados e uma estrutura de código organizada, escalável e de fácil manutenção.

O sistema deve ser desenvolvido com foco em arquitetura limpa, segurança, padronização da modelagem de dados e boas práticas de backend.

---

## 2. Objetivo do Produto

O objetivo principal é entregar uma API backend capaz de gerenciar informações relacionadas à frota de veículos da empresa.

A API deve permitir que usuários autenticados possam:

- Gerenciar modelos de veículos.
- Gerenciar veículos.
- Consultar veículos com uso de cache.
- Manter rastreabilidade básica das entidades através de metadados.
- Operar com segurança utilizando autenticação JWT.
- Executar testes automatizados para garantir confiabilidade da aplicação.

---

## 3. Escopo Obrigatório

O sistema deve implementar obrigatoriamente os seguintes módulos:

### 3.1 Gestão de Models

O módulo de modelos de veículos deve permitir:

- Criar um modelo.
- Atualizar um modelo.
- Consultar um modelo específico.
- Listar modelos.
- Remover um modelo.

A entidade `models` representa o modelo de um veículo, por exemplo: Corolla, Civic, Gol, Hilux, Onix.

### 3.2 Gestão de Vehicles

O módulo de veículos deve permitir:

- Registrar um veículo.
- Atualizar os dados de um veículo.
- Consultar um veículo específico.
- Listar veículos.
- Remover um veículo.

A entidade `vehicles` representa um veículo real da frota, contendo dados como placa, chassi, renavam, ano e modelo relacionado.

### 3.3 Autenticação e Segurança

A aplicação deve utilizar autenticação JWT.

Todas as rotas da aplicação devem ser protegidas, permitindo acesso apenas a usuários autenticados.

Deve existir um usuário padrão para seed com o identificador `aivacol`.

### 3.4 Cache com Redis

O uso de Redis é obrigatório.

O cache deve ser aplicado nas consultas de veículos.

A expiração do cache deve ser configurável por variável de ambiente.

O cache deve ser invalidado automaticamente quando um veículo for criado, atualizado ou removido.

### 3.5 Testes Automatizados

A aplicação deve conter testes automatizados utilizando Jest.

Os testes devem cobrir, no mínimo:

- Regras de negócio.
- Serviços.
- Validações.
- Integrações mínimas.

---

## 4. Escopo Bônus

Os seguintes itens são considerados diferenciais:

### 4.1 Gestão de Brands

Implementar uma entidade `brands` para representar as marcas dos veículos.

O módulo de marcas deve permitir:

- Criar uma marca.
- Atualizar uma marca.
- Consultar uma marca específica.
- Listar marcas.
- Remover uma marca.
- Associar modelos a uma marca.

Exemplo:

- Brand: Toyota
- Model: Corolla
- Vehicle: veículo com placa específica associado ao modelo Corolla

### 4.2 Gestão de Users

Implementar uma entidade `users` para representar os usuários do sistema.

A entidade pode conter:

- Identificador.
- Nome curto.
- Nome completo.
- Email.

### 4.3 Mensageria

A aplicação pode implementar mensageria como bônus.

As opções sugeridas são:

- RabbitMQ, preferencialmente.
- Kafka.
- SQS.

A mensageria pode ser utilizada para registrar eventos importantes do sistema, como criação, atualização e remoção de veículos.

### 4.4 Auditoria

A aplicação pode registrar interações do serviço em banco não relacional, como:

- MongoDB.
- DynamoDB.

A auditoria pode armazenar ações importantes realizadas na API, como:

- Criação de veículo.
- Atualização de veículo.
- Remoção de veículo.
- Criação de modelo.
- Atualização de modelo.
- Remoção de modelo.
- Login de usuário.

### 4.5 Docker

Como bônus, a aplicação pode conter:

- Dockerfile multistage.
- Docker Compose completo com app, SQL Server, Redis e serviços opcionais como RabbitMQ e MongoDB.

---

## 5. Entidades do Domínio

## 5.1 Model

Representa o modelo de um veículo.

Campos obrigatórios:

| Campo      | Descrição                         |
| ---------- | --------------------------------- |
| id         | Identificador do modelo           |
| name       | Nome do modelo                    |
| created_at | Data de criação                   |
| updated_at | Data de atualização               |
| created_by | Usuário responsável pelo cadastro |

Regras esperadas:

- O nome do modelo deve ser obrigatório.
- O nome do modelo não deve ser vazio.
- O modelo deve possuir metadados de criação e atualização.
- O modelo pode estar associado a veículos.
- Caso o bônus de marcas seja implementado, o modelo também pode estar associado a uma marca.

---

## 5.2 Vehicle

Representa um veículo da frota.

Campos obrigatórios:

| Campo         | Descrição                         |
| ------------- | --------------------------------- |
| id            | Identificador do veículo          |
| license_plate | Placa                             |
| chassis       | Chassi                            |
| renavam       | Renavam                           |
| year          | Ano                               |
| model_id      | Referência para o modelo          |
| created_at    | Data de criação                   |
| updated_at    | Data de atualização               |
| created_by    | Usuário responsável pelo cadastro |

Regras esperadas:

- A placa do veículo deve ser obrigatória.
- O chassi deve ser obrigatório.
- O renavam deve ser obrigatório.
- O ano deve ser obrigatório.
- O veículo deve estar associado a um modelo existente.
- O veículo deve possuir metadados de criação e atualização.
- Ao criar, atualizar ou remover um veículo, o cache de consultas de veículos deve ser invalidado.

---

## 5.3 Brand — Bônus

Representa a marca de um veículo.

Campos sugeridos:

| Campo      | Descrição                         |
| ---------- | --------------------------------- |
| id         | Identificador da marca            |
| name       | Nome da marca                     |
| created_at | Data de criação                   |
| updated_at | Data de atualização               |
| created_by | Usuário responsável pelo cadastro |

Regras esperadas:

- O nome da marca deve ser obrigatório.
- A marca pode possuir vários modelos.
- Um modelo pode pertencer a uma marca.

---

## 5.4 User — Bônus

Representa um usuário do sistema.

Campos sugeridos:

| Campo    | Descrição                |
| -------- | ------------------------ |
| id       | Identificador do usuário |
| nickname | Nome curto               |
| name     | Nome completo            |
| email    | Email                    |

Regras esperadas:

- O email deve ser único.
- O email deve ser válido.
- O usuário poderá ser utilizado para autenticação JWT.
- O usuário poderá ser usado como referência no campo `created_by`.

---

## 6. Requisitos Funcionais

### RF01 — Autenticar usuário

O sistema deve permitir que um usuário realize autenticação.

Ao autenticar com sucesso, o sistema deve retornar um token JWT.

O token JWT deve ser utilizado para acessar as rotas protegidas.

---

### RF02 — Criar modelo de veículo

O sistema deve permitir criar um novo modelo de veículo.

Dados mínimos:

- Nome do modelo.

O sistema deve registrar:

- Data de criação.
- Data de atualização.
- Usuário responsável.

---

### RF03 — Listar modelos de veículos

O sistema deve permitir listar os modelos cadastrados.

---

### RF04 — Consultar modelo por ID

O sistema deve permitir consultar os dados de um modelo específico.

Caso o modelo não exista, o sistema deve retornar erro adequado.

---

### RF05 — Atualizar modelo de veículo

O sistema deve permitir atualizar os dados de um modelo.

Caso o modelo não exista, o sistema deve retornar erro adequado.

---

### RF06 — Remover modelo de veículo

O sistema deve permitir remover um modelo.

Caso existam veículos associados ao modelo, o sistema deve impedir a remoção ou tratar a regra de forma segura para evitar inconsistência de dados.

---

### RF07 — Criar veículo

O sistema deve permitir registrar um novo veículo.

Dados mínimos:

- Placa.
- Chassi.
- Renavam.
- Ano.
- Modelo associado.

Ao criar um veículo, o cache de consulta de veículos deve ser invalidado.

---

### RF08 — Listar veículos

O sistema deve permitir listar veículos cadastrados.

As consultas de veículos devem utilizar cache Redis.

---

### RF09 — Consultar veículo por ID

O sistema deve permitir consultar os dados de um veículo específico.

As consultas de veículos devem utilizar cache Redis.

Caso o veículo não exista, o sistema deve retornar erro adequado.

---

### RF10 — Atualizar veículo

O sistema deve permitir atualizar os dados de um veículo.

Ao atualizar um veículo, o cache de consulta de veículos deve ser invalidado.

Caso o veículo não exista, o sistema deve retornar erro adequado.

---

### RF11 — Remover veículo

O sistema deve permitir remover um veículo.

Ao remover um veículo, o cache de consulta de veículos deve ser invalidado.

Caso o veículo não exista, o sistema deve retornar erro adequado.

---

### RF12 — Registrar auditoria — Bônus

O sistema pode registrar eventos importantes em banco não relacional.

Eventos sugeridos:

- Criação de veículo.
- Atualização de veículo.
- Remoção de veículo.
- Criação de modelo.
- Atualização de modelo.
- Remoção de modelo.
- Login de usuário.

---

### RF13 — Publicar eventos de domínio — Bônus

O sistema pode publicar eventos em mensageria para ações importantes.

Eventos sugeridos:

- `vehicle.created`
- `vehicle.updated`
- `vehicle.deleted`
- `model.created`
- `model.updated`
- `model.deleted`

---

## 7. Requisitos Não Funcionais

### RNF01 — Linguagem e runtime

A aplicação deve utilizar Node.js versão 18 ou superior.

---

### RNF02 — Framework

A aplicação deve utilizar NestJS versão 10 ou superior, preferencialmente.

---

### RNF03 — Banco de dados relacional

A aplicação deve utilizar SQL Server como banco de dados principal.

---

### RNF04 — ORM

A aplicação deve utilizar TypeORM para mapeamento das entidades e operações com banco de dados.

---

### RNF05 — Segurança

A aplicação deve utilizar JWT para autenticação.

Todas as rotas devem ser protegidas.

---

### RNF06 — Cache

A aplicação deve utilizar Redis para cache das consultas de veículos.

O tempo de expiração do cache deve ser configurável por variável de ambiente.

---

### RNF07 — Testes

A aplicação deve utilizar Jest para testes automatizados.

---

### RNF08 — Organização

A aplicação deve possuir estrutura organizada, modular e de fácil manutenção.

---

### RNF09 — Migrations

A aplicação deve possuir migrations bem definidas para criação e manutenção das tabelas.

---

### RNF10 — Docker

A aplicação pode utilizar Docker para facilitar execução local e entrega.

Como bônus, deve conter Dockerfile multistage e Docker Compose completo.

---

## 8. Regras de Negócio

### RN01 — Todas as entidades devem possuir metadados

As entidades principais devem possuir:

- `created_at`
- `updated_at`
- `created_by`

Esses campos permitem rastrear quando o registro foi criado, quando foi atualizado e qual usuário realizou a ação.

---

### RN02 — Veículo deve estar associado a um modelo existente

Não deve ser possível cadastrar um veículo apontando para um `model_id` inexistente.

---

### RN03 — Cache de veículos deve ser invalidado em operações de escrita

Sempre que um veículo for criado, atualizado ou removido, o cache relacionado às consultas de veículos deve ser invalidado.

---

### RN04 — Consultas de veículos devem utilizar cache

As consultas de veículos devem primeiro verificar se existe resultado em cache.

Se existir cache válido, o sistema deve retornar o resultado cacheado.

Se não existir cache válido, o sistema deve buscar os dados no banco, retornar a resposta e armazenar o resultado no Redis.

---

### RN05 — Rotas protegidas

Nenhuma rota de negócio deve ser acessada sem token JWT válido.

---

### RN06 — Usuário padrão de seed

O sistema deve possuir um usuário padrão para seed com o identificador `aivacol`.

Esse usuário pode ser utilizado para autenticação inicial e preenchimento do campo `created_by`.

---

### RN07 — Remoção segura de registros relacionados

O sistema deve evitar inconsistência de dados ao remover entidades relacionadas.

Exemplo:

- Não remover um modelo se existirem veículos associados a ele.
- Ou aplicar uma estratégia clara de remoção, desde que documentada.

---

## 9. Sugestão de Endpoints

### Autenticação

| Método | Rota        | Descrição                         |
| ------ | ----------- | --------------------------------- |
| POST   | /auth/login | Autenticar usuário e retornar JWT |

---

### Models

| Método | Rota        | Descrição               |
| ------ | ----------- | ----------------------- |
| POST   | /models     | Criar modelo            |
| GET    | /models     | Listar modelos          |
| GET    | /models/:id | Consultar modelo por ID |
| PATCH  | /models/:id | Atualizar modelo        |
| DELETE | /models/:id | Remover modelo          |

---

### Vehicles

| Método | Rota          | Descrição                          |
| ------ | ------------- | ---------------------------------- |
| POST   | /vehicles     | Criar veículo                      |
| GET    | /vehicles     | Listar veículos com cache          |
| GET    | /vehicles/:id | Consultar veículo por ID com cache |
| PATCH  | /vehicles/:id | Atualizar veículo                  |
| DELETE | /vehicles/:id | Remover veículo                    |

---

### Brands — Bônus

| Método | Rota        | Descrição              |
| ------ | ----------- | ---------------------- |
| POST   | /brands     | Criar marca            |
| GET    | /brands     | Listar marcas          |
| GET    | /brands/:id | Consultar marca por ID |
| PATCH  | /brands/:id | Atualizar marca        |
| DELETE | /brands/:id | Remover marca          |

---

## 10. Critérios de Aceite

O projeto será considerado completo quando:

- A API estiver funcionando.
- As rotas obrigatórias de models estiverem implementadas.
- As rotas obrigatórias de vehicles estiverem implementadas.
- Todas as rotas de negócio estiverem protegidas por JWT.
- O SQL Server estiver sendo utilizado como banco principal.
- O TypeORM estiver configurado corretamente.
- As migrations estiverem presentes.
- O Redis estiver implementado nas consultas de veículos.
- O cache for invalidado ao criar, atualizar ou remover veículos.
- Os testes com Jest estiverem presentes e passando.
- O README possuir instruções claras de execução.
- O repositório possuir o arquivo `seed_vehicles.json`.
- O projeto possuir scripts de execução.
- O código estiver organizado, sem redundâncias desnecessárias e seguindo boas práticas REST.

---

## 11. Fora de Escopo Inicial

Os seguintes itens não são obrigatórios na primeira entrega:

- Interface frontend.
- Painel administrativo.
- Controle avançado de permissões.
- Upload de imagens de veículos.
- Relatórios.
- Integração com APIs externas.
- Deploy em cloud.
- Observabilidade avançada.
- Filas obrigatórias.
- Auditoria obrigatória em banco não relacional.

---

## 12. Decisões Técnicas Iniciais

Para atender ao desafio, a implementação inicial deve seguir estas decisões:

- Utilizar NestJS como framework principal.
- Utilizar TypeORM como ORM.
- Utilizar SQL Server como banco relacional.
- Utilizar Redis para cache.
- Utilizar JWT para autenticação.
- Utilizar Jest para testes.
- Implementar Docker Compose para facilitar execução local.
- Implementar migrations para controle de estrutura do banco.
- Criar seed inicial com usuário `aivacol` e dados de veículos.

---

## 13. Prioridade de Implementação

### Prioridade 1 — Obrigatório

- Configuração base do projeto.
- Banco SQL Server.
- TypeORM.
- Migrations.
- Autenticação JWT.
- CRUD de models.
- CRUD de vehicles.
- Cache Redis para vehicles.
- Testes obrigatórios.
- README.
- Seed de veículos.

### Prioridade 2 — Melhorias importantes

- Validações robustas.
- Tratamento global de erros.
- Padronização de respostas.
- Paginação em listagens.
- Filtros básicos em vehicles.
- Docker Compose completo.

### Prioridade 3 — Bônus

- Brands.
- Users completos.
- RabbitMQ.
- Auditoria com MongoDB ou DynamoDB.
- Dockerfile multistage.
- Eventos de domínio.

---

## 14. Resultado Esperado

Ao final da implementação, o projeto deve entregar uma API backend robusta para gestão de frota, com autenticação, banco relacional, cache, testes e documentação clara.

A entrega deve demonstrar domínio de arquitetura backend, segurança, modelagem relacional, uso de cache, testes automatizados e boas práticas de organização de código.
