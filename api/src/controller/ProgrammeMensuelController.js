import { programmeMensuelService } from '../service/ProgrammeMensuelService.js';

export class ProgrammeMensuelController {
  static list = async (req, res) => {
    const programmes = await programmeMensuelService.listPublished();
    return res.status(200).json(programmes);
  };
}
