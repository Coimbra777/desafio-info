import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/**
 * Monta a UI Swagger em /api/swagger (e o JSON em /api/swagger-json).
 * Controlado pela env SWAGGER_ENABLED: qualquer valor diferente de "false" habilita.
 */
export function setupSwagger(app: INestApplication): void {
  if (process.env.SWAGGER_ENABLED === "false") {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle("Aivacol Fleet Management API")
    .setDescription(
      "API de gestão de frotas da Aivacol. Autentique-se em POST /auth/login, " +
        "clique em Authorize e cole o accessToken para testar as rotas protegidas.",
    )
    .setVersion("0.1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Cole aqui o accessToken retornado por POST /auth/login",
      },
      "access-token",
    )
    .addTag("auth", "Autenticação e emissão de token JWT")
    .addTag("users", "Cadastro e gestão de usuários")
    .addTag("brands", "Marcas de veículos")
    .addTag("models", "Modelos vinculados a uma marca")
    .addTag("vehicles", "Veículos da frota (com cache e auditoria)")
    .addTag("audit", "Logs de auditoria de negócio")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/swagger", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
