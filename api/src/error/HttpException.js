// ============================================================
// HttpException.js — Hiérarchie des erreurs HTTP.
//
// Les services et contrôleurs lèvent ces exceptions au lieu de fabriquer
// des réponses brutes, afin que le middleware errorHandler centralisé
// puisse formater chaque erreur de la même manière et ne jamais divulguer
// de stack trace en production.
// ============================================================

export class HttpException extends Error {
  /**
   * @param {number} status - Code de statut HTTP (4xx ou 5xx).
   * @param {string} message - Message lisible, sûr à exposer au client.
   * @param {unknown} [details] - Charge utile structurée optionnelle (ex. erreurs de validation par champ).
   */
  constructor(status, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request', details) {
    super(400, message, details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable Entity', details) {
    super(422, message, details);
  }
}
