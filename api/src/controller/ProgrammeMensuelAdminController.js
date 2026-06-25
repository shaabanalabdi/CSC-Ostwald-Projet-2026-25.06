import { programmeMensuelService } from '../service/ProgrammeMensuelService.js';

export class ProgrammeMensuelAdminController {
  static list = async (req, res) => {
    const programmes = await programmeMensuelService.listAll();
    return res.status(200).json(programmes);
  };

  static getOne = async (req, res) => {
    const p = await programmeMensuelService.getOne(Number(req.params.id));
    return res.status(200).json(p);
  };

  static create = async (req, res) => {
    const p = await programmeMensuelService.create(req.body);
    return res.status(201).json(p);
  };

  static update = async (req, res) => {
    const p = await programmeMensuelService.update(Number(req.params.id), req.body);
    return res.status(200).json(p);
  };

  static remove = async (req, res) => {
    await programmeMensuelService.remove(Number(req.params.id));
    return res.status(204).send();
  };
}
