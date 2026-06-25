import { contactSettingsService } from '../service/ContactSettingsService.js';

export class ContactSettingsController {
  /** GET /api/contact-settings */
  static get = async (req, res) => {
    const settings = await contactSettingsService.get();
    return res.status(200).json(settings);
  };
}
