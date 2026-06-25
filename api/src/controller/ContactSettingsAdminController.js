import { contactSettingsService } from '../service/ContactSettingsService.js';

export class ContactSettingsAdminController {
  /** GET /api/admin/contact-settings */
  static get = async (req, res) => {
    const settings = await contactSettingsService.get();
    return res.status(200).json(settings);
  };

  /** PATCH /api/admin/contact-settings */
  static update = async (req, res) => {
    const settings = await contactSettingsService.update(req.body);
    return res.status(200).json(settings);
  };
}
