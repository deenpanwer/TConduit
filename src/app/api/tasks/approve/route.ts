import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { updateTaskTool } from '@/lib/ai/tools/tasks';
import { createTaskTool } from '@/lib/ai/tools/tasks';

export async function POST(req: Request) {
    try {
        const { proposalId, orgId, action } = await req.json();

        if (!proposalId || !orgId) {
            return NextResponse.json({ error: 'Missing proposalId or orgId' }, { status: 400 });
        }

        const admin = getFirebaseAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const db = admin.firestore();
        const proposalRef = db.collection('organizations').doc(orgId).collection('proposals').doc(proposalId);
        const proposalSnap = await proposalRef.get();

        if (!proposalSnap.exists) {
            return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
        }

        const proposalData = proposalSnap.data()!;

        if (proposalData.status !== 'pending') {
            return NextResponse.json({ error: `Proposal is already ${proposalData.status}` }, { status: 400 });
        }

        if (action === 'reject') {
            await proposalRef.update({
                status: 'rejected',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return NextResponse.json({ success: true, status: 'rejected' });
        }

        if (action === 'approve') {
            const { type, payload, targetId, createdBy } = proposalData;
            let result: any;

            if (type === 'create') {
                // Execute Create Task
                // Note: Using the execute function directly from the tool for internal consistency
                result = await createTaskTool.execute!(payload, { toolCallId: `appr_${proposalId}`, messages: [] });
            } else if (type === 'update') {
                // Execute Update Task
                result = await updateTaskTool.execute!({
                    orgId,
                    taskId: targetId,
                    userId: createdBy,
                    updates: payload
                }, { toolCallId: `appr_${proposalId}`, messages: [] });
            } else if (type === 'delete') {
                // Execute Delete Task
                const taskRef = db.collection('organizations').doc(orgId).collection('tasks').doc(targetId);
                await taskRef.update({
                    isDeleted: true,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                result = { success: true };
            }

            if (result?.success) {
                await proposalRef.update({
                    status: 'approved',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                return NextResponse.json({ success: true, status: 'approved', result });
            } else {
                return NextResponse.json({ error: 'Failed to execute proposed action', details: result?.error }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[Approval API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
