import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ExplorationNode, ExplorationOutcome } from '../types';
import { SectionCard } from './SectionCard';
import { MapPin, Plus, Trash, Edit2, Save, Image as ImageIcon, Crosshair, AlertTriangle, X, Package, Coins, FileText, Upload } from 'lucide-react';

export const InvestigationEditor: React.FC = () => {
    // --- STATE ---
    const [nodes, setNodes] = useState<ExplorationNode[]>([]);
    const [mapUrl, setMapUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // 아이템 목록 불러오기 (드롭다운용)
    const [allItems, setAllItems] = useState<any[]>([]);

    // Modal & Selection
    const [selectedNode, setSelectedNode] = useState<ExplorationNode | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'info' | 'loot'>('info');

    // Editing State (Form)
    const [editForm, setEditForm] = useState<Partial<ExplorationNode>>({});
    
    // Loot Table State
    const [outcomes, setOutcomes] = useState<ExplorationOutcome[]>([]);
    const [editingOutcome, setEditingOutcome] = useState<Partial<ExplorationOutcome>>({});

    // --- INITIAL LOAD ---
    useEffect(() => {
        fetchMapConfig();
        fetchNodes();
        fetchItems(); 
    }, []);

    // --- FETCH DATA ---
    const fetchMapConfig = async () => {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'global_map_url').single();
        if (data) setMapUrl(data.value);
        setLoading(false);
    };

    const fetchNodes = async () => {
        const { data } = await supabase.from('exploration_nodes').select('*');
        if (data) setNodes(data);
    };
    
    const fetchItems = async () => {
        const { data } = await supabase.from('items').select('id, name, rarity').order('name');
        if (data) setAllItems(data);
    };

    const fetchOutcomes = async (nodeId: string) => {
        const { data } = await supabase.from('exploration_outcomes').select('*').eq('node_id', nodeId);
        if (data) setOutcomes(data);
        else setOutcomes([]);
    };

    // --- MAP INTERACTIONS ---
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // [수정] 16:9 박스 내부를 기준으로 좌표 계산
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newNode: Partial<ExplorationNode> = {
            name: 'New Sector',
            description: '',
            x_pos: parseFloat(x.toFixed(2)),
            y_pos: parseFloat(y.toFixed(2)),
            daily_limit_cost: 1
        };

        setEditForm(newNode);
        setSelectedNode(null); 
        setOutcomes([]);
        setModalTab('info');
        setIsModalOpen(true);
    };

    const handleNodeClick = (e: React.MouseEvent, node: ExplorationNode) => {
        e.stopPropagation();
        setSelectedNode(node);
        setEditForm(node);
        fetchOutcomes(node.id);
        setIsModalOpen(true);
    };

    const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `global_map_${Date.now()}.${fileExt}`;

        setLoading(true);
        const { error: uploadError } = await supabase.storage.from('maps').upload(fileName, file);
        if (uploadError) {
            alert("Upload failed: " + uploadError.message);
            setLoading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('maps').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('system_settings').upsert({ key: 'global_map_url', value: publicUrl });
        
        if (!dbError) {
            setMapUrl(publicUrl);
        }
        setLoading(false);
    };

    // --- CRUD OPERATIONS ---
    const saveNode = async () => {
        if (!editForm.name) return alert("Name is required");

        const payload = {
            name: editForm.name,
            description: editForm.description,
            x_pos: editForm.x_pos,
            y_pos: editForm.y_pos,
            daily_limit_cost: editForm.daily_limit_cost,
            image_url: editForm.image_url
        };

        let resultNode;

        if (selectedNode?.id) {
            const { data, error } = await supabase.from('exploration_nodes').update(payload).eq('id', selectedNode.id).select().single();
            if (error) return alert("Update failed");
            resultNode = data;
        } else {
            const { data, error } = await supabase.from('exploration_nodes').insert([payload]).select().single();
            if (error) return alert("Create failed");
            resultNode = data;
        }

        setSelectedNode(resultNode);
        setEditForm(resultNode);
        fetchNodes();
        
        if (!selectedNode) {
            alert("Node created! You can now configure the Loot Table.");
        } else {
            alert("Node saved.");
        }
    };

    const deleteNode = async () => {
        if (!selectedNode) return;
        if (!confirm("Delete this node? All outcomes will be removed.")) return;
        
        await supabase.from('exploration_nodes').delete().eq('id', selectedNode.id);
        setIsModalOpen(false);
        fetchNodes();
    };

    // --- OUTCOME OPERATIONS ---
    const saveOutcome = async () => {
        if (!selectedNode) return alert("Save the node first!");
        
        const payload = {
            node_id: selectedNode.id,
            result_type: editingOutcome.result_type || 'text',
            result_value: editingOutcome.result_value || '',
            script_text: editingOutcome.script_text || '',
            probability: editingOutcome.probability || 10
        };

        if (editingOutcome.id) {
            await supabase.from('exploration_outcomes').update(payload).eq('id', editingOutcome.id);
        } else {
            await supabase.from('exploration_outcomes').insert([payload]);
        }
        
        setEditingOutcome({});
        fetchOutcomes(selectedNode.id);
    };

    const deleteOutcome = async (id: string) => {
        await supabase.from('exploration_outcomes').delete().eq('id', id);
        if (selectedNode) fetchOutcomes(selectedNode.id);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* TOOLBAR */}
            <div className="flex justify-between items-center bg-[#05140e] p-3 border border-[#d4af37]/20 shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="text-[#f9eabb] font-['Cinzel'] font-bold flex items-center gap-2">
                        <Crosshair size={20} className="text-[#d4af37]" /> Investigation Map Editor
                    </h3>
                    <p className="text-gray-500 text-xs hidden md:block">Click anywhere on the map to add a new investigation sector.</p>
                </div>
                <div className="flex items-center gap-2">
                     <label className="flex items-center gap-2 px-3 py-1.5 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase cursor-pointer hover:bg-[#d4af37] hover:text-black transition-colors">
                        <Upload size={14}/> {mapUrl ? 'Change Map Image' : 'Upload Map Image'}
                        <input type="file" accept="image/*" onChange={handleMapUpload} className="hidden"/>
                     </label>
                </div>
            </div>

            {/* MAIN CONTENT SPLIT */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                
                {/* LIST SIDEBAR */}
                <div className="w-1/4 h-full flex flex-col min-w-[200px]">
                    <SectionCard title="Sector List" className="h-full flex flex-col" noPadding>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {nodes.map(node => (
                                <div 
                                    key={node.id}
                                    onClick={(e) => handleNodeClick(e, node)}
                                    className={`p-3 border-b border-[#d4af37]/10 cursor-pointer hover:bg-[#d4af37]/5 transition-colors ${selectedNode?.id === node.id ? 'bg-[#d4af37]/10 border-l-2 border-l-[#d4af37]' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className={selectedNode?.id === node.id ? 'text-[#d4af37]' : 'text-gray-500'} />
                                        <span className="text-[#f9eabb] text-sm font-bold truncate">{node.name}</span>
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                                        <span>Cost: {node.daily_limit_cost}</span>
                                        <span>{Math.round(Number(node.x_pos))},{Math.round(Number(node.y_pos))}</span>
                                    </div>
                                </div>
                            ))}
                            {nodes.length === 0 && (
                                <div className="p-4 text-center text-gray-500 text-xs italic">
                                    No sectors defined.<br/>Click on the map to create one.
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                {/* MAP CANVAS (수정됨) */}
                <div className="flex-1 h-full bg-[#020f0a] border border-[#d4af37]/20 flex items-center justify-center p-8 overflow-hidden group">
                    
                    {/* [핵심] 16:9 비율 강제 고정 및 중앙 정렬 컨테이너 */}
                    <div 
                        className="relative aspect-[16/9] w-full max-w-full max-h-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#d4af37]/10 cursor-crosshair"
                        onMouseDown={handleMapClick}
                    >
                         {/* Background Image */}
                         {mapUrl ? (
                             <img 
                                src={mapUrl} 
                                className="w-full h-full object-cover pointer-events-none select-none" 
                                alt="Map" 
                             />
                         ) : (
                             <div className="w-full h-full bg-[linear-gradient(rgba(212,175,55,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.1)_1px,transparent_1px)] bg-[size:40px_40px] flex items-center justify-center pointer-events-none select-none">
                                 <div className="text-center opacity-30">
                                     <ImageIcon size={64} className="mx-auto text-[#d4af37] mb-2"/>
                                     <p className="text-[#d4af37] font-['Cinzel']">No Map Image Loaded</p>
                                     <p className="text-xs text-gray-500">Using Blueprint Mode (16:9)</p>
                                 </div>
                             </div>
                         )}

                         {/* Pins */}
                         {nodes.map(node => (
                             <div
                                key={node.id}
                                onClick={(e) => handleNodeClick(e, node)}
                                style={{ left: `${node.x_pos}%`, top: `${node.y_pos}%` }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group/pin"
                             >
                                 <div className="relative">
                                     <MapPin 
                                        size={32} 
                                        className={`drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] transition-all ${selectedNode?.id === node.id ? 'text-white scale-125' : 'text-[#d4af37] group-hover/pin:text-white'}`} 
                                        fill={selectedNode?.id === node.id ? '#d4af37' : 'currentColor'}
                                        fillOpacity={selectedNode?.id === node.id ? 1 : 0.2}
                                     />
                                     <span className="absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-20 animate-ping inset-0 pointer-events-none"></span>
                                 </div>
                                 <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black/80 text-[#d4af37] text-[10px] px-2 py-0.5 rounded border border-[#d4af37]/30 opacity-0 group-hover/pin:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                     {node.name}
                                 </div>
                             </div>
                         ))}

                         {/* Ghost Pin for New Creation */}
                         {!selectedNode && isModalOpen && editForm.x_pos && (
                             <div 
                                style={{ left: `${editForm.x_pos}%`, top: `${editForm.y_pos}%` }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                             >
                                 <MapPin size={32} className="text-white" />
                             </div>
                         )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-[#020f0a] border border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-[#d4af37]/20 bg-[#05140e]">
                            <h3 className="text-xl font-['Cinzel'] text-[#f9eabb]">
                                {selectedNode ? 'Edit Sector Details' : 'Initialize New Sector'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-[#d4af37]/20">
                            <button 
                                onClick={() => setModalTab('info')}
                                className={`flex-1 py-3 text-xs uppercase font-bold tracking-widest ${modalTab === 'info' ? 'bg-[#d4af37] text-black' : 'text-gray-500 hover:bg-[#d4af37]/10'}`}
                            >
                                Basic Information
                            </button>
                            <button 
                                onClick={() => {
                                    if(!selectedNode) alert("Please save the sector first.");
                                    else setModalTab('loot');
                                }}
                                className={`flex-1 py-3 text-xs uppercase font-bold tracking-widest ${modalTab === 'loot' ? 'bg-[#d4af37] text-black' : 'text-gray-500 hover:bg-[#d4af37]/10'} ${!selectedNode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Loot Table (Outcomes)
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {modalTab === 'info' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-[#d4af37] uppercase">Sector Name</label>
                                            <input 
                                                type="text" 
                                                value={editForm.name || ''} 
                                                onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                                className="w-full bg-black border border-[#d4af37]/30 p-2 text-[#f9eabb] text-sm focus:border-[#d4af37] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-[#d4af37] uppercase">Action Cost</label>
                                            <input 
                                                type="number" 
                                                value={editForm.daily_limit_cost || 1} 
                                                onChange={e => setEditForm({...editForm, daily_limit_cost: parseInt(e.target.value)})} 
                                                className="w-full bg-black border border-[#d4af37]/30 p-2 text-[#f9eabb] text-sm focus:border-[#d4af37] outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase">X Position (%)</label>
                                            <input type="number" value={editForm.x_pos || 0} readOnly className="w-full bg-[#05140e] border border-transparent p-2 text-gray-500 text-sm cursor-not-allowed"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Y Position (%)</label>
                                            <input type="number" value={editForm.y_pos || 0} readOnly className="w-full bg-[#05140e] border border-transparent p-2 text-gray-500 text-sm cursor-not-allowed"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#d4af37] uppercase">Description</label>
                                        <textarea 
                                            value={editForm.description || ''} 
                                            onChange={e => setEditForm({...editForm, description: e.target.value})} 
                                            className="w-full h-24 bg-black border border-[#d4af37]/30 p-2 text-[#f9eabb] text-sm focus:border-[#d4af37] outline-none resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#d4af37] uppercase">Detail Image URL (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={editForm.image_url || ''} 
                                            onChange={e => setEditForm({...editForm, image_url: e.target.value})} 
                                            className="w-full bg-black border border-[#d4af37]/30 p-2 text-[#f9eabb] text-sm focus:border-[#d4af37] outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="flex justify-between pt-4 border-t border-[#d4af37]/10 mt-4">
                                        {selectedNode && (
                                            <button onClick={deleteNode} className="text-red-500 hover:text-red-400 text-xs uppercase font-bold flex items-center gap-2">
                                                <Trash size={14} /> Delete Sector
                                            </button>
                                        )}
                                        <div className="flex gap-2 ml-auto">
                                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-[#d4af37]/30 text-gray-400 text-xs uppercase font-bold hover:text-white">Cancel</button>
                                            <button onClick={saveNode} className="px-4 py-2 bg-[#d4af37] text-black text-xs uppercase font-bold hover:bg-[#f9eabb] flex items-center gap-2">
                                                <Save size={14}/> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // LOOT TABLE TAB (기존 코드 유지)
                                <div className="space-y-6">
                                    <div className="bg-[#05140e] border border-[#d4af37]/30 p-4">
                                        <h4 className="text-[#d4af37] text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                            {editingOutcome.id ? <Edit2 size={12}/> : <Plus size={12}/>} 
                                            {editingOutcome.id ? 'Edit Outcome Rule' : 'Add New Outcome'}
                                        </h4>
                                        <div className="grid grid-cols-4 gap-2 mb-2">
                                            <div>
                                                <label className="text-[9px] uppercase text-gray-500 block mb-1">Type</label>
                                                <select 
                                                    value={editingOutcome.result_type || 'text'} 
                                                    onChange={e => setEditingOutcome({...editingOutcome, result_type: e.target.value as any})} 
                                                    className="w-full bg-black border border-[#d4af37]/20 text-[#f9eabb] text-xs p-2 outline-none"
                                                >
                                                    <option value="text">Story/Text</option>
                                                    <option value="coin">Coin Reward</option>
                                                    <option value="item">Item Drop</option>
                                                    <option value="trap">Trap/Damage</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[9px] uppercase text-gray-500 block mb-1">
                                                    {editingOutcome.result_type === 'item' ? 'Select Item' : 'Value (ID or Amount)'}
                                                </label>
                                                {editingOutcome.result_type === 'item' ? (
                                                    <select
                                                        value={editingOutcome.result_value || ''}
                                                        onChange={e => setEditingOutcome({...editingOutcome, result_value: e.target.value})}
                                                        className="w-full bg-black border border-[#d4af37]/20 text-[#f9eabb] text-xs p-2 outline-none"
                                                    >
                                                        <option value="">-- Select Item --</option>
                                                        {allItems.map(item => (
                                                            <option key={item.id} value={item.id}>
                                                                [{item.rarity}] {item.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        value={editingOutcome.result_value || ''} 
                                                        onChange={e => setEditingOutcome({...editingOutcome, result_value: e.target.value})} 
                                                        className="w-full bg-black border border-[#d4af37]/20 text-[#f9eabb] text-xs p-2 outline-none"
                                                        placeholder={editingOutcome.result_type === 'coin' ? 'e.g. 500' : 'Value'}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[9px] uppercase text-gray-500 block mb-1">Weight</label>
                                                <input 
                                                    type="number" 
                                                    value={editingOutcome.probability || 10} 
                                                    onChange={e => setEditingOutcome({...editingOutcome, probability: parseInt(e.target.value)})} 
                                                    className="w-full bg-black border border-[#d4af37]/20 text-[#f9eabb] text-xs p-2 outline-none" 
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="text-[9px] uppercase text-gray-500 block mb-1">Script Message</label>
                                            <input 
                                                type="text" 
                                                value={editingOutcome.script_text || ''} 
                                                onChange={e => setEditingOutcome({...editingOutcome, script_text: e.target.value})} 
                                                className="w-full bg-black border border-[#d4af37]/20 text-[#f9eabb] text-xs p-2 outline-none" 
                                                placeholder="e.g. You found a secret safe!" 
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-3">
                                            {editingOutcome.id && (
                                                <button onClick={() => setEditingOutcome({})} className="text-xs text-gray-500 underline mr-auto">Clear Form</button>
                                            )}
                                            <button onClick={saveOutcome} className="bg-[#d4af37] text-black text-xs font-bold py-1.5 px-4 hover:bg-[#f9eabb]">
                                                {editingOutcome.id ? 'Update Rule' : 'Add Rule'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border border-[#d4af37]/10">
                                        <table className="w-full text-xs text-left">
                                            <thead className="text-[10px] uppercase bg-black text-gray-500 border-b border-[#d4af37]/10">
                                                <tr>
                                                    <th className="px-3 py-2">Type</th>
                                                    <th className="px-3 py-2">Script</th>
                                                    <th className="px-3 py-2">Value</th>
                                                    <th className="px-3 py-2 text-right">Weight</th>
                                                    <th className="px-3 py-2 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#d4af37]/10">
                                                {outcomes.length === 0 && (
                                                    <tr><td colSpan={5} className="p-4 text-center text-gray-500 italic">No outcomes defined.</td></tr>
                                                )}
                                                {outcomes.map(oc => (
                                                    <tr key={oc.id} className="hover:bg-[#d4af37]/5">
                                                        <td className="px-3 py-2 uppercase text-gray-400 flex items-center gap-2">
                                                            {oc.result_type === 'coin' ? <Coins size={10} className="text-yellow-500"/> : 
                                                             oc.result_type === 'item' ? <Package size={10} className="text-blue-500"/> :
                                                             oc.result_type === 'trap' ? <AlertTriangle size={10} className="text-red-500"/> :
                                                             <FileText size={10} className="text-gray-500"/>}
                                                            {oc.result_type}
                                                        </td>
                                                        <td className="px-3 py-2 text-[#f9eabb] truncate max-w-[150px]">{oc.script_text}</td>
                                                        <td className="px-3 py-2 font-mono text-[#d4af37]">{oc.result_value}</td>
                                                        <td className="px-3 py-2 text-right text-gray-400">{oc.probability}</td>
                                                        <td className="px-3 py-2 text-right flex justify-end gap-2">
                                                            <button onClick={() => setEditingOutcome(oc)} className="text-blue-400 hover:text-white"><Edit2 size={12}/></button>
                                                            <button onClick={() => deleteOutcome(oc.id)} className="text-red-400 hover:text-white"><Trash size={12}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};