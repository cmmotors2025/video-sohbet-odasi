import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Tv, BarChart3, Trash2, Play, Pause, Edit, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Room {
  id: string;
  code: string;
  owner_id: string;
  created_at: string;
  video_state?: {
    video_url: string | null;
    is_playing: boolean;
    playback_time: number;
  };
  owner_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch rooms with video state
    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (roomsData) {
      // Fetch video states and owner profiles for each room
      const roomsWithDetails = await Promise.all(
        roomsData.map(async (room) => {
          const { data: videoState } = await supabase
            .from('video_state')
            .select('video_url, is_playing, playback_time')
            .eq('room_id', room.id)
            .single();

          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', room.owner_id)
            .single();

          return {
            ...room,
            video_state: videoState || undefined,
            owner_profile: ownerProfile || undefined
          };
        })
      );
      setRooms(roomsWithDetails);
    }

    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData) {
      setProfiles(profilesData);
    }

    setLoading(false);
  };

  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      toast.error('Oda silinemedi');
    } else {
      toast.success('Oda silindi');
      fetchData();
    }
  };

  const handleTogglePlay = async (roomId: string, currentlyPlaying: boolean) => {
    const { error } = await supabase
      .from('video_state')
      .update({ is_playing: !currentlyPlaying, updated_at: new Date().toISOString() })
      .eq('room_id', roomId);

    if (error) {
      toast.error('Durum güncellenemedi');
    } else {
      toast.success(currentlyPlaying ? 'Video duraklatıldı' : 'Video oynatılıyor');
      fetchData();
    }
  };

  const handleUpdateVideoUrl = async () => {
    if (!editingRoom) return;

    const { error } = await supabase
      .from('video_state')
      .update({ video_url: newVideoUrl, updated_at: new Date().toISOString() })
      .eq('room_id', editingRoom.id);

    if (error) {
      toast.error('Video URL güncellenemedi');
    } else {
      toast.success('Video URL güncellendi');
      setEditingRoom(null);
      setNewVideoUrl('');
      fetchData();
    }
  };

  const handleClearChat = async (roomId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', roomId);

    if (error) {
      toast.error('Sohbet temizlenemedi');
    } else {
      toast.success('Sohbet temizlendi');
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen cinema-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen cinema-gradient p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Admin Paneli</h1>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              Odalar
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              İstatistikler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Aktif Odalar ({rooms.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Sahip</TableHead>
                      <TableHead>Video</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Eylemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-mono font-bold">{room.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={room.owner_profile?.avatar_url || ''} />
                              <AvatarFallback>{room.owner_profile?.username?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{room.owner_profile?.username || 'Bilinmiyor'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {room.video_state?.video_url || 'Video yok'}
                        </TableCell>
                        <TableCell>
                          {room.video_state?.is_playing ? (
                            <span className="text-green-500 text-sm">Oynatılıyor</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Duraklatıldı</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePlay(room.id, room.video_state?.is_playing || false)}
                            >
                              {room.video_state?.is_playing ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingRoom(room);
                                setNewVideoUrl(room.video_state?.video_url || '');
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleClearChat(room.id)}
                            >
                              <Trash2 className="w-4 h-4 text-yellow-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRoom(room.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Henüz oda yok
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Kayıtlı Kullanıcılar ({profiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar</TableHead>
                      <TableHead>Kullanıcı Adı</TableHead>
                      <TableHead>Kayıt Tarihi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback>{profile.username[0]}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{profile.username}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Oda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{rooms.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kullanıcı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{profiles.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Video URL Edit Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Video URL Düzenle</DialogTitle>
          </DialogHeader>
          <Input
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            placeholder="HLS veya YouTube URL girin"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>
              İptal
            </Button>
            <Button onClick={handleUpdateVideoUrl}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
