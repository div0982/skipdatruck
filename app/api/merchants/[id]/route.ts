
if (!user) {
    return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
    );
}

// Delete user (cascade will delete trucks, orders, etc.)
await prisma.user.delete({
    where: { id: userId }
});

return NextResponse.json({
    success: true,
    message: `Deleted merchant account: ${user.email}`
});

    } catch (error: any) {
    console.error('Delete merchant error:', error);
    return NextResponse.json(
        { error: error.message || 'Failed to delete merchant' },
        { status: 500 }
    );
}
}
