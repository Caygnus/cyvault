import React from "react";
import { getVaults } from "@/actions/vault-actions";
import { VaultResponse } from "@/domain";
import { Page, Card, AddButton } from "@/components/atoms";

const VaultsPage = async () => {
    const vaultsData = await getVaults();

    return (
        <Page
            heading="Vaults"
            headingCTA={<AddButton label="Create Vault" />}
        >
            {vaultsData ? (
                <div className="space-y-4">
                    {vaultsData.items.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-500">No vaults found. Create your first vault to get started!</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {vaultsData.items.map((vault: VaultResponse) => (
                                    <VaultCard key={vault.id} vault={vault} />
                                ))}
                            </div>

                            {vaultsData.pagination && vaultsData.pagination.total > vaultsData.items.length && (
                                <div className="text-center text-sm text-gray-500 mt-4">
                                    Showing {vaultsData.items.length} of {vaultsData.pagination.total} vaults
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600">Failed to load vaults. Please try again later.</p>
                </div>
            )}
        </Page>
    );
};

interface VaultCardProps {
    vault: VaultResponse;
}

const VaultCard = ({ vault }: VaultCardProps) => {
    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {vault.name}
                    </h3>
                    {vault.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {vault.description}
                        </p>
                    )}
                </div>
                {vault.color && (
                    <div
                        className="w-6 h-6 rounded-full shrink-0 ml-2 border border-gray-200"
                        style={{ backgroundColor: vault.color }}
                        aria-label={`Vault color: ${vault.color}`}
                    />
                )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                <span className="capitalize">{vault.status}</span>
                <span>{new Date(vault.createdAt).toLocaleDateString()}</span>
            </div>
        </Card>
    );
};

export default VaultsPage;

