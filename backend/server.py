from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import uuid

# Import models
from models import (
    Client, ClientCreate, ClientUpdate,
    Project, ProjectCreate, ProjectUpdate,
    TimeEntry, TimeEntryCreate, TimeEntryUpdate,
    Invoice, InvoiceCreate, InvoiceUpdate,
    ActiveTimer, ActiveTimerCreate, TimerStartRequest, TimerStopResponse,
    SuccessResponse, ErrorResponse
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
clients_collection = db.clients
projects_collection = db.projects
time_entries_collection = db.time_entries
invoices_collection = db.invoices
active_timers_collection = db.active_timers

# Create the main app
app = FastAPI(title="TimeTracker API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def serialize_document(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if '_id' in doc:
        del doc['_id']
    return doc

async def check_client_exists(client_id: str):
    """Check if client exists"""
    client = await clients_collection.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return serialize_document(client)

async def check_project_exists(project_id: str):
    """Check if project exists"""
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return serialize_document(project)

# CLIENT ENDPOINTS
@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    """Get all clients"""
    try:
        clients = await clients_collection.find().to_list(1000)
        return [serialize_document(client) for client in clients]
    except Exception as e:
        logging.error(f"Error fetching clients: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate):
    """Create a new client"""
    try:
        # Check if email already exists
        existing_client = await clients_collection.find_one({"email": client_data.email})
        if existing_client:
            raise HTTPException(status_code=400, detail="Client with this email already exists")
        
        client = Client(**client_data.dict())
        client_dict = client.dict()
        
        await clients_collection.insert_one(client_dict)
        return serialize_document(client_dict)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating client: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    """Get a specific client"""
    return await check_client_exists(client_id)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientUpdate):
    """Update a client"""
    try:
        await check_client_exists(client_id)
        
        # If email is being updated, check it's not already taken
        if client_data.email:
            existing_client = await clients_collection.find_one({
                "email": client_data.email,
                "id": {"$ne": client_id}
            })
            if existing_client:
                raise HTTPException(status_code=400, detail="Client with this email already exists")
        
        update_data = {k: v for k, v in client_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await clients_collection.update_one(
            {"id": client_id},
            {"$set": update_data}
        )
        
        updated_client = await clients_collection.find_one({"id": client_id})
        return serialize_document(updated_client)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating client: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.delete("/clients/{client_id}", response_model=SuccessResponse)
async def delete_client(client_id: str):
    """Delete a client"""
    try:
        await check_client_exists(client_id)
        
        # Check if client has projects
        projects = await projects_collection.find({"client_id": client_id}).to_list(1)
        if projects:
            raise HTTPException(status_code=400, detail="Cannot delete client with existing projects")
        
        result = await clients_collection.delete_one({"id": client_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Client not found")
        
        return SuccessResponse(message="Client deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting client: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# PROJECT ENDPOINTS
@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    """Get all projects"""
    try:
        projects = await projects_collection.find().to_list(1000)
        return [serialize_document(project) for project in projects]
    except Exception as e:
        logging.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate):
    """Create a new project"""
    try:
        # Verify client exists
        await check_client_exists(project_data.client_id)
        
        project = Project(**project_data.dict())
        project_dict = project.dict()
        
        await projects_collection.insert_one(project_dict)
        return serialize_document(project_dict)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a specific project"""
    return await check_project_exists(project_id)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_data: ProjectUpdate):
    """Update a project"""
    try:
        await check_project_exists(project_id)
        
        # If client_id is being updated, verify new client exists
        if project_data.client_id:
            await check_client_exists(project_data.client_id)
        
        update_data = {k: v for k, v in project_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await projects_collection.update_one(
            {"id": project_id},
            {"$set": update_data}
        )
        
        updated_project = await projects_collection.find_one({"id": project_id})
        return serialize_document(updated_project)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.delete("/projects/{project_id}", response_model=SuccessResponse)
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        await check_project_exists(project_id)
        
        # Check if project has time entries
        time_entries = await time_entries_collection.find({"project_id": project_id}).to_list(1)
        if time_entries:
            raise HTTPException(status_code=400, detail="Cannot delete project with existing time entries")
        
        result = await projects_collection.delete_one({"id": project_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return SuccessResponse(message="Project deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# TIME ENTRY ENDPOINTS
@api_router.get("/time-entries", response_model=List[TimeEntry])
async def get_time_entries():
    """Get all time entries"""
    try:
        time_entries = await time_entries_collection.find().to_list(1000)
        return [serialize_document(entry) for entry in time_entries]
    except Exception as e:
        logging.error(f"Error fetching time entries: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/time-entries", response_model=TimeEntry)
async def create_time_entry(time_entry_data: TimeEntryCreate):
    """Create a new time entry"""
    try:
        # Verify project exists
        await check_project_exists(time_entry_data.project_id)
        
        time_entry = TimeEntry(**time_entry_data.dict())
        time_entry_dict = time_entry.dict()
        
        await time_entries_collection.insert_one(time_entry_dict)
        return serialize_document(time_entry_dict)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating time entry: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/time-entries/{entry_id}", response_model=TimeEntry)
async def get_time_entry(entry_id: str):
    """Get a specific time entry"""
    try:
        time_entry = await time_entries_collection.find_one({"id": entry_id})
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return serialize_document(time_entry)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching time entry: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.put("/time-entries/{entry_id}", response_model=TimeEntry)
async def update_time_entry(entry_id: str, time_entry_data: TimeEntryUpdate):
    """Update a time entry"""
    try:
        # Check if time entry exists
        existing_entry = await time_entries_collection.find_one({"id": entry_id})
        if not existing_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        # If project_id is being updated, verify new project exists
        if time_entry_data.project_id:
            await check_project_exists(time_entry_data.project_id)
        
        update_data = {k: v for k, v in time_entry_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await time_entries_collection.update_one(
            {"id": entry_id},
            {"$set": update_data}
        )
        
        updated_entry = await time_entries_collection.find_one({"id": entry_id})
        return serialize_document(updated_entry)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating time entry: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.delete("/time-entries/{entry_id}", response_model=SuccessResponse)
async def delete_time_entry(entry_id: str):
    """Delete a time entry"""
    try:
        result = await time_entries_collection.delete_one({"id": entry_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        return SuccessResponse(message="Time entry deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting time entry: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# TIMER ENDPOINTS
@api_router.get("/timer/active", response_model=Optional[ActiveTimer])
async def get_active_timer():
    """Get the currently active timer"""
    try:
        timer = await active_timers_collection.find_one()
        return serialize_document(timer) if timer else None
    except Exception as e:
        logging.error(f"Error fetching active timer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/timer/start", response_model=ActiveTimer)
async def start_timer(timer_data: TimerStartRequest):
    """Start a new timer"""
    try:
        # Verify project exists
        await check_project_exists(timer_data.project_id)
        
        # Stop any existing timer first
        await active_timers_collection.delete_many({})
        
        # Create new timer
        timer = ActiveTimer(**timer_data.dict())
        timer_dict = timer.dict()
        
        await active_timers_collection.insert_one(timer_dict)
        return serialize_document(timer_dict)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error starting timer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/timer/stop", response_model=TimerStopResponse)
async def stop_timer():
    """Stop the active timer and create a time entry"""
    try:
        # Get active timer
        timer = await active_timers_collection.find_one()
        if not timer:
            raise HTTPException(status_code=404, detail="No active timer found")
        
        # Calculate duration
        end_time = datetime.utcnow()
        start_time = timer["start_time"]
        duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        if duration_minutes < 1:
            duration_minutes = 1  # Minimum 1 minute
        
        # Create time entry
        time_entry_data = {
            "project_id": timer["project_id"],
            "description": timer["description"],
            "start_time": start_time,
            "end_time": end_time,
            "duration": duration_minutes,
            "date": start_time.strftime("%Y-%m-%d"),
            "is_manual": False
        }
        
        time_entry = TimeEntry(**time_entry_data)
        time_entry_dict = time_entry.dict()
        
        await time_entries_collection.insert_one(time_entry_dict)
        
        # Delete the timer
        await active_timers_collection.delete_one({"id": timer["id"]})
        
        return TimerStopResponse(
            message="Timer stopped successfully",
            time_entry=serialize_document(time_entry_dict)
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error stopping timer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# INVOICE ENDPOINTS
@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices():
    """Get all invoices"""
    try:
        invoices = await invoices_collection.find().to_list(1000)
        return [serialize_document(invoice) for invoice in invoices]
    except Exception as e:
        logging.error(f"Error fetching invoices: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate):
    """Create a new invoice"""
    try:
        # Verify client and project exist
        await check_client_exists(invoice_data.client_id)
        await check_project_exists(invoice_data.project_id)
        
        # Check if invoice number already exists
        existing_invoice = await invoices_collection.find_one({"invoice_number": invoice_data.invoice_number})
        if existing_invoice:
            raise HTTPException(status_code=400, detail="Invoice number already exists")
        
        invoice = Invoice(**invoice_data.dict())
        invoice_dict = invoice.dict()
        
        await invoices_collection.insert_one(invoice_dict)
        return serialize_document(invoice_dict)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating invoice: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    """Get a specific invoice"""
    try:
        invoice = await invoices_collection.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return serialize_document(invoice)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching invoice: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, invoice_data: InvoiceUpdate):
    """Update an invoice"""
    try:
        # Check if invoice exists
        existing_invoice = await invoices_collection.find_one({"id": invoice_id})
        if not existing_invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # If client_id or project_id is being updated, verify they exist
        if invoice_data.client_id:
            await check_client_exists(invoice_data.client_id)
        if invoice_data.project_id:
            await check_project_exists(invoice_data.project_id)
        
        # If invoice number is being updated, check it's not already taken
        if invoice_data.invoice_number:
            existing_number = await invoices_collection.find_one({
                "invoice_number": invoice_data.invoice_number,
                "id": {"$ne": invoice_id}
            })
            if existing_number:
                raise HTTPException(status_code=400, detail="Invoice number already exists")
        
        update_data = {k: v for k, v in invoice_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await invoices_collection.update_one(
            {"id": invoice_id},
            {"$set": update_data}
        )
        
        updated_invoice = await invoices_collection.find_one({"id": invoice_id})
        return serialize_document(updated_invoice)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating invoice: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.delete("/invoices/{invoice_id}", response_model=SuccessResponse)
async def delete_invoice(invoice_id: str):
    """Delete an invoice"""
    try:
        result = await invoices_collection.delete_one({"id": invoice_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return SuccessResponse(message="Invoice deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting invoice: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "TimeTracker API is running"}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
