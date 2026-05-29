import { Request, Response } from 'express';
import TenantService from '../services/tenant.service';
import prisma from '../config/prisma';

export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await TenantService.getAllTenants();
    res.json(tenants);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  try {
    const tenant = await TenantService.createTenant(req.body);
    res.status(201).json(tenant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTenantDetail = async (req: Request, res: Response) => {
  try {
    const tenant = await TenantService.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const stats = await TenantService.getSystemStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const tenant = await TenantService.updateTenant(req.params.id, req.body);
    res.json(tenant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getGlobalLeads = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, sector, search } = req.query;
    const leads = await TenantService.getGlobalLeads({ 
      limit: Number(limit), 
      offset: Number(offset), 
      sector: sector as any,
      search: search as string
    });
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBillingSummary = async (req: Request, res: Response) => {
  try {
    const summary = await TenantService.getBillingSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFormTemplates = async (req: Request, res: Response) => {
  try {
    const { sector } = req.query;
    const templates = await TenantService.getFormTemplates(sector as any);
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createFormTemplate = async (req: any, res: Response) => {
  try {
    const template = await TenantService.createFormTemplate({
      ...req.body,
      tenantId: req.user.tenantId
    });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await TenantService.getAnalytics();
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getConnectorDefinitions = async (req: Request, res: Response) => {
  try {
    const definitions = await (prisma as any).connectorDefinition.findMany();
    res.json(definitions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createConnectorDefinition = async (req: Request, res: Response) => {
  try {
    const definition = await (prisma as any).connectorDefinition.create({
      data: req.body
    });
    res.status(201).json(definition);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateConnectorDefinition = async (req: Request, res: Response) => {
  try {
    const definition = await (prisma as any).connectorDefinition.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(definition);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteConnectorDefinition = async (req: Request, res: Response) => {
  try {
    await (prisma as any).connectorDefinition.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
