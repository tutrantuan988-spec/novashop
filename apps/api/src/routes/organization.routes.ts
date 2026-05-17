import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';

const router = Router();

router.post('/', organizationController.createOrganization.bind(organizationController));
router.get('/', organizationController.getOrganizations.bind(organizationController));
router.get('/:id', organizationController.getOrganization.bind(organizationController));
router.put('/:id', organizationController.updateOrganization.bind(organizationController));
router.post('/:id/invite', organizationController.inviteMember.bind(organizationController));
router.get('/:id/members', organizationController.getMembers.bind(organizationController));
router.put('/:id/members/:memberId', organizationController.updateMemberRole.bind(organizationController));
router.delete('/:id/members/:memberId', organizationController.removeMember.bind(organizationController));

export default router;
