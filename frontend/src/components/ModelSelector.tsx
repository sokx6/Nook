import { Select, Badge, Modal, Button, Typography, message } from "antd";
import { DownloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useEffect, useState, useCallback } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

const { Text } = Typography;

const DOWNLOADABLE_MODELS = [
	{ name: "qwen2.5:0.5b", size: "~400MB" },
	{ name: "qwen2.5:1.5b", size: "~1.0GB" },
	{ name: "qwen2.5:3b", size: "~1.9GB" },
	{ name: "qwen2.5:7b", size: "~4.7GB" },
	{ name: "qwen3:0.6b", size: "~400MB" },
	{ name: "qwen3:1.8b", size: "~1.1GB" },
	{ name: "qwen3:4b", size: "~2.4GB" },
	{ name: "llama3.2:3b", size: "~2.0GB" },
	{ name: "deepseek-r1:1.5b", size: "~1.1GB" },
	{ name: "deepseek-r1:7b", size: "~4.7GB" },
	{ name: "phi4:14b", size: "~7.9GB" },
];

interface ModelInfo {
	id: string;
	name: string;
	provider: string;
	local: boolean;
}

export default function ModelSelectorHeader() {
	const { settings, updateSettings } = useSettingsStore();
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [downloadOpen, setDownloadOpen] = useState(false);
	const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
	const [downloadedModels, setDownloadedModels] = useState<Set<string>>(
		new Set(),
	);

	const fetchModels = useCallback(() => {
		setLoading(true);
		fetch(`${settings.baseUrl}/api/models`, {
			headers: { Accept: "application/json" },
		})
			.then((r) => r.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setModels(data);
					if (!settings.model && data.length > 0) {
						updateSettings({ model: data[0].id || data[0].name });
					}
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [settings.baseUrl]);

	useEffect(() => {
		fetchModels();
	}, [fetchModels]);

	const handleDownload = async (modelName: string) => {
		setDownloadingModel(modelName);
		try {
			const res = await fetch(
				`${settings.baseUrl}/api/models/pull?model_name=${encodeURIComponent(modelName)}`,
				{ method: "POST", headers: { Accept: "application/json" } },
			);
			const data = await res.json();
			if (data.ok) {
				setDownloadedModels((prev) => new Set(prev).add(modelName));
				fetchModels();
				message.success(`${modelName} 下载完成`);
				fetchModels();
				updateSettings({ model: `ollama:${modelName}` });
				setDownloadOpen(false);
			} else {
				message.error(`下载失败: ${data.message}`);
			}
		} catch {
			message.error("下载失败，请检查后端连接");
		} finally {
			setDownloadingModel(null);
		}
	};

	const options = [
		...models.map((m) => ({
			value: m.id || m.name,
			label: (
				<span style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<Badge status={m.local ? "success" : "processing"} />
					<span>{m.name}</span>
				</span>
			),
		})),
		{ type: "divider" as const },
		{
			value: "__download__",
			label: (
				<span
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						color: "var(--ds-accent)",
					}}
				>
					<DownloadOutlined />
					<span>下载模型</span>
				</span>
			),
		},
	];

	const isInstalled = (name: string) =>
		models.some((m) => m.name === name || m.id === name) ||
		downloadedModels.has(name);

	return (
		<>
			<Select
				value={settings.model || undefined}
				onChange={(v) => {
					if (v === "__download__") {
						setDownloadOpen(true);
            fetchModels()
						return;
					}
					updateSettings({ model: v });
				}}
				loading={loading}
				placeholder="选择模型"
				popupMatchSelectWidth={false}
				style={{ minWidth: 150 }}
				options={options}
				variant="borderless"
				onDropdownVisibleChange={(open) => {
					if (open) fetchModels();
				}}
				styles={{
					selector: {
						color: "var(--ds-text-secondary) !important",
					},
				}}
			/>

			<Modal
				title="下载模型"
				open={downloadOpen}
				onCancel={() => setDownloadOpen(false)}
				footer={null}
				width={480}
			>
				<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{DOWNLOADABLE_MODELS.map((m) => {
						const installed = isInstalled(m.name);
						const isDownloading = downloadingModel === m.name;

						return (
							<div
								key={m.name}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: 12,
									padding: "10px 12px",
									borderRadius: 8,
								}}
							>
								<div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
									<Text style={{ fontSize: 13 }} ellipsis>{m.name}</Text>
									<Text
										type="secondary"
										style={{ fontSize: 11, marginLeft: 8, flexShrink: 0 }}
									>
										{m.size}
									</Text>
								</div>
								{installed ? (
									<Text type="success" style={{ fontSize: 12, flexShrink: 0 }}>
										<CheckCircleOutlined style={{ marginRight: 4 }} />
										已安装
									</Text>
								) : (
									<Button
										size="small"
										type="primary"
										loading={isDownloading}
										icon={<DownloadOutlined />}
										onClick={() => handleDownload(m.name)}
										style={{ borderRadius: 8, flexShrink: 0 }}
									>
										{isDownloading ? "下载中" : "下载"}
									</Button>
								)}
							</div>
						);
					})}
				</div>
			</Modal>
		</>
	);
}
